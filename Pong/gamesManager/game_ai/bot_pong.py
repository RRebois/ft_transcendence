import random
import asyncio
import time
from asgiref.sync import sync_to_async

from configFiles.globals import *
from ..models import *

class PongBot():
	instances = 0
	q_table = {}
	REDUCTION = 20
	ALPHA = 0.1 #learning rate
	GAMMA = 0.85 #discount factor
	EPSILON = 0.1 #exploration rate
	actions = [-1, 0, 1] #moves [up, nothing, down]

	def __init__(self, game, player, bot_db, training=False):
		self.training = training
		self.bot_db = bot_db
		self.game = game
		self.player = player
		# self.bot_score = 0
		self.history = []


	async def update_q_table_n_steps(self):
		if not len(self.history):
			return

		g_reward = 0
		for state, action, reward, new_state in reversed(self.history):
			g_reward = reward + PongBot.GAMMA * g_reward

			if state not in PongBot.q_table:
				PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

			old_value = PongBot.q_table[state][action]
			future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
			new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
			PongBot.q_table[state][action] = new_value

		self.history = []

	async def predict_ball_position(self, ball_x, ball_y, ball_v_x, ball_v_y, paddle_x):
		height = GAME_HEIGHT // PongBot.REDUCTION
		time_to_reach_paddle = (paddle_x - ball_x) / max(ball_v_x, 1)

		predicted_y = ball_y + ball_v_y * time_to_reach_paddle

		while predicted_y < 0 or predicted_y > height:
			if predicted_y < 0:
				predicted_y = -predicted_y
			elif predicted_y > height:
				predicted_y = 2 * height - predicted_y

		return predicted_y

	async def get_reward(self, state, action):
		ball_x, ball_y, ball_v_x, ball_v_y, paddle_x, paddle_y = state
		predicted_y = await self.predict_ball_position(ball_x, ball_y, ball_v_x, ball_v_y, paddle_x)

		distance_to_ball = predicted_y - paddle_y // PongBot.REDUCTION
		if not distance_to_ball:
			return 10
		if distance_to_ball > 0 and action == 1:
			return 1
		if distance_to_ball < 0 and action == -1:
			return 1
		else:
			return -1

	async def get_state(self):
		serialize = await self.game.serialize()
		paddle_pos = serialize['players'][f'player{self.player}']['pos']
		ball = serialize['ball']
		ball['x'] = ball['x'] // PongBot.REDUCTION
		ball['y'] = ball['y'] // PongBot.REDUCTION
		ball['x_vel'] = round(ball['x_vel'])
		ball['y_vel'] = round(ball['y_vel'])
		paddle_pos['x'] = paddle_pos['x'] // PongBot.REDUCTION
		paddle_pos['y'] = round(paddle_pos['y'])

		return (ball['x'], ball['y'], ball['x_vel'], ball['y_vel'], paddle_pos['x'], paddle_pos['y'])

	async def choose_action(self, state):
		print('\n\n\nmerdei aqui', PongBot.q_table.get(state))
		if random.uniform(0, 1) < PongBot.EPSILON or not PongBot.q_table.get(state):
			return random.choice(PongBot.actions)
		else:
			return max(PongBot.q_table.get(state, {a: 0 for a in PongBot.actions}),
			  key=PongBot.q_table.get(state, {a: 0 for a in PongBot.actions}).get)

	async def continuous_paddle_mov(self, state):
		print(f'\n\n\nInside paddle mov before action')
		action = await self.choose_action(state)
		print(f'Inside paddle mov => {action}')
		if action:
			player_move = {'player': self.player, 'direction': action}
			await self.game.move_player_paddle(player_move)

		return action

	async def bot_loop(self):
		last_time = time.time()
		state = await self.get_state()
		refresh_rate = 1 if not self.training else 0.25
		sleep_rate = SLEEP * 2 if not self.training else SLEEP / 4
		while True:
			curr_time = time.time()
			if curr_time - last_time >= refresh_rate:
				new_state = await self.get_state()
				for step in self.history:
					step[-1] = new_state
				await self.update_q_table_n_steps()
				last_time = curr_time
				state = new_state
			action = await self.continuous_paddle_mov(state)
			tmp_state = (state[-1] + action,)
			state = state[:-1] + tmp_state
			reward = await self.get_reward(state, action)
			self.history.append([state, action, reward, state])

			await asyncio.sleep(sleep_rate)

	async def launch_bot(self):
		if not PongBot.instances:
			PongBot.q_table = await sync_to_async(self.bot_db.load_table)()
		PongBot.instances += 1
		if not self.training:
			print(PongBot.q_table)
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
