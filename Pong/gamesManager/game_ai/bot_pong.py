import random
import asyncio
import time
from asgiref.sync import sync_to_async

from configFiles.globals import *
from ..models import *

class PongBot():
	instances = 0
	q_table = {}
	REDUCTION = 56
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

		self.test = {}



	async def update_q_table_n_steps(self):
		if not len(self.history):
			return
		g_reward = 0
		first_node = len(self.history) - 1
		for i, (state, action, reward, new_state) in enumerate(reversed(self.history)):
			g_reward = reward + PongBot.GAMMA * g_reward
			if i == first_node or not i:

				if state not in PongBot.q_table:
					PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

				old_value = PongBot.q_table[state][action]
				future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
				new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
				PongBot.q_table[state][action] = new_value
		self.history = []

		# for state, action, reward, new_state in reversed(self.history):
		# 	g_reward = reward + PongBot.GAMMA * g_reward

		# 	if state not in PongBot.q_table:
		# 		PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

		# 	old_value = PongBot.q_table[state][action]
		# 	future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
		# 	new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
		# 	PongBot.q_table[state][action] = new_value
		# self.history = []

	async def update_q_table(self, state, action, reward, new_state):
		if state not in PongBot.q_table:
			PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

		old_value = PongBot.q_table[state][action]
		future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
		new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (reward + PongBot.GAMMA * future_max)
		PongBot.q_table[state][action] = new_value

	async def predict_ball_position(self, state):

		height = GAME_HEIGHT // PongBot.REDUCTION
		distance_x, distance_y, ball_speed, paddle_y = state
		
		if not ball_speed:
			return paddle_y
		if distance_x <= 0:
			return height // 2
		# Usar distância e velocidade para prever a posição futura da bola
		time_to_reach_paddle = distance_x / (ball_speed if ball_speed > 0 else 1)
		predicted_y = paddle_y - distance_y + (distance_y / time_to_reach_paddle)
		
		# Considerar os rebotes
		while predicted_y < 0 or predicted_y > height:
			if predicted_y < 0:
				predicted_y = -predicted_y
			elif predicted_y > height:
				predicted_y = 2 * height - predicted_y

		return predicted_y

	async def get_reward(self, state, action):

		distance_x, distance_y, ball_speed, paddle_y = state
		predicted_y = await self.predict_ball_position(state)

		# Recompensa baseada em quão perto a raquete está da posição prevista da bola
		distance_to_predict = predicted_y - paddle_y
		distance_penalty = abs(distance_to_predict)
		speed_penalty = ball_speed * 0.1
		proximity_penalty = 1 / abs(distance_x) if distance_x != 0 else 0.1

		if 0 <= distance_to_predict < PADDLE_HEIGHT_DUO // PongBot.REDUCTION:
			return 100 - speed_penalty  # Alta recompensa por interceptar a bola corretamente

		if 0 <= distance_x < 5:  # Bola está muito próxima da raquete
			return -10 - 2 * distance_penalty - speed_penalty

		return -1 - distance_penalty - speed_penalty - proximity_penalty


	async def calculate_state(self, ball_x, ball_y, ball_v_x, ball_v_y, paddle_x, paddle_y):
		direction = 1 if ball_v_x > 0 else -1
		distance_x = ((paddle_x - ball_x) * direction) // PongBot.REDUCTION
		distance_y = (paddle_y - ball_y) // PongBot.REDUCTION
		ball_speed = round((ball_v_x ** 2 + ball_v_y ** 2) ** 0.5)

		return (distance_x, distance_y, ball_speed, paddle_y // PongBot.REDUCTION)

	async def get_state(self):
		serialize = await self.game.serialize()
		paddle_pos = serialize['players'][f'player{self.player}']['pos']
		ball = serialize['ball']
		self.raw_pos = paddle_pos['y']
		state = await self.calculate_state(ball['x'], ball['y'], ball['x_vel'], ball['y_vel'], paddle_pos['x'], paddle_pos['y'])

		self.test['get_state'] = [serialize, state]
		return state


	async def choose_action(self, state):
		self.test['choose_action'] = 'q-table'
		if random.uniform(0, 1) < PongBot.EPSILON or not PongBot.q_table.get(state):
			predicted_y = await self.predict_ball_position(state)
			distance = predicted_y - state[-1]
			self.test['choose_action'] = [distance, predicted_y, state[-1]]
			if distance < 0:
				return -1
			if distance < (PADDLE_HEIGHT_DUO / PongBot.REDUCTION):
				return 0
			if distance > 0:
				return 1
		# else:
		return max(PongBot.q_table.get(state, {a: 0 for a in PongBot.actions}),
			  key=PongBot.q_table.get(state, {a: 0 for a in PongBot.actions}).get)

	async def continuous_paddle_mov(self, state):
		action = await self.choose_action(state)
		if action:
			player_move = {'player': self.player, 'direction': action}
			await self.game.move_player_paddle(player_move)

		return action

	async def bot_loop(self):
		last_time = time.time()
		state = await self.get_state()
		refresh_rate = 1 if not self.training else 0.125
		sleep_rate = SLEEP * 2 if not self.training else SLEEP / 4
		while True:
			curr_time = time.time()
			if curr_time - last_time >= refresh_rate:
				new_state = await self.get_state()
				action = await self.continuous_paddle_mov(state)
				reward = await self.get_reward(new_state, action)
				self.history.append([state, action, reward, new_state])
				# self.history[0][-1] = new_state
				await self.update_q_table_n_steps()
				if not self.training:
					print(f"\n\n\nq-table size => {len(PongBot.q_table)}\nstate => {state}\naction => {action}\nnew_state => {new_state}\nreward => {reward}\ntest => {self.test}\n\n\n")
				last_time = curr_time
				state = new_state
			action = await self.continuous_paddle_mov(state)

			self.raw_pos += action * PADDLE_START_VEL
			new_state = state[:-1] + (self.raw_pos // PongBot.REDUCTION,)


			reward = await self.get_reward(new_state, action)
			self.history.append([state, action, reward, new_state])
			state = new_state

			await asyncio.sleep(sleep_rate)

	async def launch_bot(self):
		if not PongBot.instances:
			PongBot.q_table = await sync_to_async(self.bot_db.load_table)()
		PongBot.instances += 1
		if not self.training:
			print("\nQ-TABLE SIZE => ", len(PongBot.q_table))
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
