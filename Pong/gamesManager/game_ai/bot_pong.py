import random
import asyncio
import time
import math
from asgiref.sync import sync_to_async

from configFiles.globals import *
from ..models import *


import logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)


class PongBot():
	instances = 0
	q_table = {}
	REDUCTION = 40
	ALPHA = 0.45 #learning rate
	GAMMA = 0.9 #discount factor
	EPSILON = 0.03 #exploration rate
	actions = [-1, 0, 1] #moves [up, nothing, down]


	def __init__(self, game, player, bot_db, training=False):
		self.training = training
		self.bot_db = bot_db
		self.game = game
		self.player = player
		self.history = []
		self.raw_pos = None
		self.losses = 0
		self.defeat = False


	async def update_q_table_n_steps(self):
		if not len(self.history):
			return
		g_reward = 0
		first_node = len(self.history) - 1
		for i, (state, action, reward, new_state) in enumerate(reversed(self.history)):
			g_reward = reward + PongBot.GAMMA * g_reward
			if state[0] != new_state[0]:

				if state not in PongBot.q_table:
					PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

				old_value = PongBot.q_table[state][action]
				future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
				new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
				PongBot.q_table[state][action] = new_value
		self.history = []

	async def predict_ball_position(self, state):
		ball_x, ball_y, ball_v_x, ball_v_y = state[0]
		paddle_x, paddle_y = state[1]
		if not ball_v_x:
			return paddle_y
		if ball_v_x < 0:
			return GAME_HEIGHT // 2

		while ball_x < PADDLE_RIGHT_X:
			ball_x += ball_v_x
			ball_y += ball_v_y
			if ball_y <= 0 or ball_y >= GAME_HEIGHT:
				ball_v_y *= -1
				ball_y = max(0, min(ball_y, GAME_HEIGHT))

		return ball_y // PongBot.REDUCTION

	async def get_reward(self, state, new_state):
		old_ball_x, old_ball_y, old_ball_v_x, old_ball_v_y = state[0]
		old_paddle_x, old_paddle_y = state[1]
		new_ball_x, new_ball_y, new_ball_v_x, new_ball_v_y = new_state[0]
		new_paddle_x, new_paddle_y = new_state[1]
		
		old_predicted_y = await self.predict_ball_position(state)
		new_predicted_y = await self.predict_ball_position(new_state)

		old_distance_to_predict = abs(old_predicted_y - old_paddle_y // PongBot.REDUCTION)
		new_distance_to_predict = abs(new_predicted_y - new_paddle_y // PongBot.REDUCTION)

		reward = old_distance_to_predict - new_distance_to_predict
		is_closer = (new_paddle_x - new_ball_x) * (1 if new_ball_v_x > 0 else -1) < (old_paddle_x - old_ball_x) * (1 if old_ball_v_x > 0 else -1)

		if self.defeat:
			reward -= 200  # Penalidade alta por perder um ponto
		
		elif old_ball_v_x > 0 and new_ball_v_x < 0:
			reward += 100  # Recompensa alta por rebater a bola
		
		elif new_distance_to_predict < PADDLE_HEIGHT_DUO:
			reward += 50 - new_distance_to_predict  # Recompensa por estar próximo à posição prevista
		
		# Small reward for moving towards the ball when it's approaching
		elif is_closer and new_distance_to_predict < old_distance_to_predict:
			reward += 5

		# Penalty for moving away from the predicted position when the ball is approaching
		elif is_closer and new_distance_to_predict > old_distance_to_predict:
			reward -= 5

		# Adjust reward based on ball speed (higher speed = higher stakes)
		reward *= (1 + new_ball_v_x / 10)

		return reward

	async def calculate_state(self, state):
		ball_x, ball_y, ball_v_x, ball_v_y = state[0]
		paddle_x, paddle_y = state[1]
		direction = 1 if ball_v_x > 0 else -1
		distance_x = round(((paddle_x - ball_x) * direction) / PongBot.REDUCTION)
		distance_y = round((paddle_y - ball_y) / PongBot.REDUCTION)
		ball_speed = round((ball_v_x ** 2 + ball_v_y ** 2) ** 0.5)

		return (distance_x, distance_y, ball_speed, int(paddle_y / PongBot.REDUCTION))

	async def get_state(self):
		serialize = await self.game.serialize()
		paddle_pos = serialize['players'][f'player{self.player}']['pos']
		ball = serialize['ball']
		self.raw_pos = paddle_pos['y']
		score = serialize['left_score']
		self.defeat = True if score != self.losses else False
		self.losses = score
		state = [[ball['x'], ball['y'], ball['x_vel'], ball['y_vel']], [paddle_pos['x'], paddle_pos['y']]]

		return state

	async def choose_action(self, state):
		exploration_limit = 0.1 if self.training else PongBot.EPSILON
		if random.uniform(0, 1) < exploration_limit:
			return random.choice(PongBot.actions)
		state_key = await self.calculate_state(state)
		# if random.uniform(0, 1) < exploration_limit:
		if state_key not in PongBot.q_table:
			predicted_y = await self.predict_ball_position(state)
			return -1 if predicted_y < state[-1][-1] // PongBot.REDUCTION else 1 if predicted_y > (state[-1][-1] + PADDLE_HEIGHT_DUO) // PongBot.REDUCTION else 0
		return max(PongBot.q_table.get(state_key, {a: 0 for a in PongBot.actions}),
			  key=PongBot.q_table.get(state_key, {a: 0 for a in PongBot.actions}).get)

	async def continuous_paddle_mov(self, state):
		action = await self.choose_action(state)
		if action:
			player_move = {'player': self.player, 'direction': action}
			await self.game.move_player_paddle(player_move)

		return action

	async def bot_loop(self):
		last_time = time.time()
		state = await self.get_state()
		refresh_rate = 1 if not self.training else 0.5
		sleep_rate = SLEEP * 2 if not self.training else SLEEP
		while True:
			try:
				curr_time = time.time()
				if curr_time - last_time >= refresh_rate:
					new_state = await self.get_state()
					action = await self.continuous_paddle_mov(state)
					reward = await self.get_reward(state, new_state)
					state_key = await self.calculate_state(state)
					new_state_key = await self.calculate_state(new_state)
					self.history.append([state_key, action, reward, new_state_key])
					change = (state[0][2] > 0 and new_state[0][2] <= 0) or (state[0][2] < 0 and new_state[0][2] >= 0) or new_state[0][2] == 0
					if self.defeat or change:
						self.history[0][-1] = new_state_key
						self.defeat = False
						await self.update_q_table_n_steps()
					last_time = curr_time
					state = new_state
				action = await self.continuous_paddle_mov(state)
				
				self.raw_pos = max(0, min(GAME_HEIGHT, self.raw_pos + action * PADDLE_START_VEL))
				new_state = state
				new_state[-1][-1] = self.raw_pos

				reward = await self.get_reward(state, new_state)
				state_key = await self.calculate_state(state)
				new_state_key = await self.calculate_state(new_state)
				self.history.append([state_key, action, reward, new_state_key])
				state = new_state

				await asyncio.sleep(sleep_rate)
			except Exception as e:
				logger.error(f'Error in bot_loop: {str(e)}', exc_info=True)

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