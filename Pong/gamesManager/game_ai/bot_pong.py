import math
import random
import asyncio
import time
from asgiref.sync import sync_to_async
from configFiles.globals import *
from ..models import *

class PongBot():
	instances = 0
	q_table = {}
	REDUCTION = PADDLE_START_VEL * 10
	ALPHA = 0.55 #learning rate
	GAMMA = 0.6 #discount factor
	EPSILON = 0.03 #exploration rate
	EPSILON_MAX = 0.2 #exploration rate
	PAD_H_REDUC = PADDLE_HEIGHT_DUO / REDUCTION
	actions = [-1, 0, 1] #moves [up, nothing, down]


	def __init__(self, game, player, bot_db, training=False):
		self.training = training
		self.bot_db = bot_db
		self.game = game
		self.player = player
		self.history = []
		self.raw_pos_pad = None
		self.ideal_pos = None
		self.old_direction = 0
		self.new_direction = 0
		self.epsilon = PongBot.EPSILON_MAX

	async def update_q_table_n_steps(self, new_state):
		if not len(self.history):
			return
		old_state = None
		new_turn = self.old_direction != self.new_direction
		if not new_turn:
			return
		g_reward = 0
		future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
		for state, action, ideal_pos in reversed(self.history):
			if state != old_state:
				reward = await self.get_reward(action, state, ideal_pos)
				g_reward = reward + PongBot.GAMMA * g_reward
				if state not in PongBot.q_table:
					PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

				old_value = PongBot.q_table[state][action]
				new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
				PongBot.q_table[state][action] = new_value
			old_state = state
		self.history = []

	async def predict_ball_position(self, ball_x, ball_y, ball_v_x, ball_v_y, paddle_x, paddle_y):
		if (self.player == 2 and ball_v_x < 0) or (self.player == 1 and ball_v_x > 0) or ball_v_x == 0:
			return int(GAME_HEIGHT / 2 / PongBot.REDUCTION)
		while (self.player == 2 and ball_x < paddle_x) or (self.player == 1 and ball_x > paddle_x):
			ball_x += ball_v_x
			ball_y += ball_v_y
			if ball_y <= 0 or ball_y >= GAME_HEIGHT:
				ball_v_y *= -1
				ball_y = max(0, min(ball_y, GAME_HEIGHT))

		return round(ball_y / PongBot.REDUCTION)

	async def is_rebound(self):
		return (self.player == 2 and self.old_direction == 1 and self.new_direction == -1) or\
			(self.player == 1 and self.old_direction == -1 and self.new_direction == 1)

	async def lost_ball(self):
		return (self.player == 2 and self.old_direction == 1 and self.new_direction == 0) or\
			(self.player == 1 and self.old_direction == -1 and self.new_direction == 0)


	async def get_reward(self, action, state, ideal_pos):

		if await self.is_rebound():
			self.old_direction = self.new_direction
			return 50 - ((ideal_pos - state[-1] + PongBot.PAD_H_REDUC * 0.5) * 0.5)
		if await self.lost_ball():
			return -(30 + abs((ideal_pos - state[-1]) * 0.5))
		if action == -1 and ideal_pos <= state[-1]:
			return 20 - abs((ideal_pos - state[-1]) * 0.5)
		if action == 1 and ideal_pos >= (state[-1] + PongBot.PAD_H_REDUC):
			return 20 - ((ideal_pos - state[-1] + PongBot.PAD_H_REDUC) * 0.5)
		if action == 0 and (state[-1] + PongBot.PAD_H_REDUC) > ideal_pos > state[-1]:
			return 20
		return -10

	async def calculate_state(self, ball_x, ball_y, ball_v_x, ball_v_y, paddle_x, paddle_y):
		correction = 1 if self.player == 2 else -1
		distance_x = int((paddle_x - ball_x) / PongBot.REDUCTION) * correction\
			if (self.player == 2 and ball_x < paddle_x) or (self.player == 1 and ball_x > paddle_x) else 0
		rad = round(math.atan2(ball_v_y, ball_v_x) * 10 * correction) * 0.1
		return (distance_x, int(ball_y / PongBot.REDUCTION), rad, int(paddle_y / PongBot.REDUCTION))

	async def get_state(self):
		serialize = await self.game.serialize()
		paddle_pos = serialize['players'][f'player{self.player}']['pos']
		ball = serialize['ball']
		self.raw_pos_pad = paddle_pos['y']
		self.old_direction = self.new_direction
		self.new_direction = 1 if ball['x_vel'] > 0 else -1 if ball['x_vel'] < 0 else 0
		self.ideal_pos = await self.predict_ball_position(ball['x'], ball['y'], ball['x_vel'], ball['y_vel'], paddle_pos['x'], paddle_pos['y'])
		state = await self.calculate_state(ball['x'], ball['y'], ball['x_vel'], ball['y_vel'], paddle_pos['x'], paddle_pos['y'])

		return state


	async def choose_action(self, state):
		if random.uniform(0, 1) < PongBot.EPSILON_MAX:
			return 0
		return -1 if self.ideal_pos <= state[-1] else 1 if self.ideal_pos >= (state[-1] + PongBot.PAD_H_REDUC) else 0
		# self.epsilon = max(PongBot.EPSILON, self.epsilon * 0.99)
		# if state not in PongBot.q_table or (self.training and random.uniform(0, 1) < self.epsilon):
		# 	return random.choice(PongBot.actions)
		# if random.uniform(0, 1) < PongBot.EPSILON:
		# 	return -1 if self.ideal_pos <= state[-1] else 1 if self.ideal_pos >= (state[-1] + PongBot.PAD_H_REDUC) else 0
		# return max(PongBot.q_table[state], key=PongBot.q_table[state].get)

	async def continuous_paddle_mov(self, state):
		action = await self.choose_action(state)
		if action:
			player_move = {'player': self.player, 'direction': action}
			await self.game.move_player_paddle(player_move)

		return action

	async def bot_loop(self):
		last_time = time.time()
		state = new_state = await self.get_state()
		refresh_rate = 1 if not self.training else 0
		sleep_rate = SLEEP if not self.training else SLEEP / 10
		while True:
				action = await self.continuous_paddle_mov(state)
				curr_time = time.time()
				if curr_time - last_time >= refresh_rate:
					new_state = await self.get_state()
					last_time = curr_time
				else:
					self.raw_pos_pad = max(0, min(GAME_HEIGHT, self.raw_pos_pad + action * PADDLE_START_VEL))
					new_state = state[:-1] + (int(self.raw_pos_pad / PongBot.REDUCTION), )
				# self.history.append([state, action, self.ideal_pos])
				# if last_time == curr_time:
					# await self.update_q_table_n_steps(new_state)
				state = new_state

				await asyncio.sleep(sleep_rate)

	async def launch_bot(self):
		if not PongBot.instances:
			PongBot.q_table = await sync_to_async(self.bot_db.load_table)()
		PongBot.instances += 1
		self.loop_task = asyncio.create_task(self.bot_loop())

	async def cancel_loop(self):
		if hasattr(self, 'loop_task'):
			self.loop_task.cancel()
			PongBot.instances -= 1
		if not PongBot.instances:
			await self.update_table_to_db()

	@sync_to_async
	def	update_table_to_db(self):
		self.bot_db.save_table(PongBot.q_table)
		with open('gamesManager/game_ai/ai_q_table.pickle', 'wb') as file:
				pickle.dump(PongBot.q_table, file)