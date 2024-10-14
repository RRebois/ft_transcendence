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

		self.test = {'prediction': [[],None]}
		self.states = []
		self.rewards = []
		self.actions = []




	async def update_q_table_n_steps(self):
		if not len(self.history):
			return
		g_reward = 0
		first_node = len(self.history) - 1
		for i, (state, action, reward, new_state) in enumerate(reversed(self.history)):
			g_reward = reward + PongBot.GAMMA * g_reward
			# if i == first_node or not i:
			if state[0] != new_state[0]:

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

		# height = GAME_HEIGHT // PongBot.REDUCTION
		# distance_x, distance_y, ball_speed, paddle_y = state
		
		# if not ball_speed:
		# 	# self.test['prediction'][0].append(paddle_y) 
		# 	return paddle_y
		# if distance_x <= 0:
		# 	# self.test['prediction'][0].append(height // 2)
		# 	return height // 2
		# # # Usar distância e velocidade para prever a posição futura da bola
		# # # time_to_reach_paddle = distance_x / (ball_speed if ball_speed > 0 else 1)
		# # # predicted_y = paddle_y - distance_y + (distance_y / time_to_reach_paddle)
		# # predicted_y = distance_y + (distance_y / distance_x) * abs(distance_x)

		# # # Considerar os rebotes
		# # while predicted_y < 0 or predicted_y > height:
		# # 	if predicted_y < 0:
		# # 		predicted_y = -predicted_y
		# # 	elif predicted_y > height:
		# # 		predicted_y = 2 * height - predicted_y

		# # return predicted_y

		# angle = abs(math.atan2(distance_y, distance_x))

		# ball_v_x = ball_speed * math.cos(angle)
		# ball_v_y = ball_speed * math.sin(angle)
		# if distance_y < 0:
		# 	ball_v_y = -ball_v_y
		# time_to_paddle = abs(distance_x / ball_v_x) if ball_v_x != 0 else 0
    
		# # Posição Y atual (não reduzida)
		# current_y = paddle_y * PongBot.REDUCTION
		
		# # Posição Y final considerando reflexões
		# final_y = current_y + (ball_v_y * time_to_paddle)
		
		# # Ajusta para reflexões nas paredes
		# effective_height = GAME_HEIGHT
		# while final_y < 0 or final_y > effective_height:
		# 	if final_y < 0:
		# 		final_y = abs(final_y)
		# 	elif final_y > effective_height:
		# 		final_y = 2 * effective_height - final_y
				
		# # Converte de volta para o espaço reduzido
		# return round(final_y / PongBot.REDUCTION)
		distance_x, distance_y, ball_speed, paddle_y = state
		if not ball_speed:
			return paddle_y
		if distance_x <= 0:
			return (GAME_HEIGHT / PongBot.REDUCTION) // 2

		angle = math.atan2(abs(distance_y * PongBot.REDUCTION), abs(distance_x * PongBot.REDUCTION))
		ball_v_x = ball_speed * math.cos(angle) * (1 if distance_x > 0 else -1)
		ball_v_y = ball_speed * math.sin(angle) * (1 if distance_y > 0 else -1)

		ball_x = GAME_WIDTH - (distance_x * PongBot.REDUCTION)
		ball_y = self.raw_pos - (distance_y * PongBot.REDUCTION)

		while ball_x < PADDLE_RIGHT_X:
			ball_x += ball_v_x
			ball_y += ball_v_y
			if ball_y <= 0 or ball_y >= GAME_HEIGHT:
				ball_v_y *= -1
				ball_y = max(0, min(ball_y, GAME_HEIGHT))

		return int(ball_y / PongBot.REDUCTION)

	async def get_reward(self, state, new_state):

		distance_x, distance_y, ball_speed, paddle_y = new_state

		if self.defeat:
			return (-abs(distance_y) + abs(state[-1])) - 80
		if state[0] > 0 and distance_x < 0:
			return 100

		predicted_y = await self.predict_ball_position(new_state)
		self.test['prediction'][0].append(predicted_y)

		# Recompensa baseada em quão perto a raquete está da posição prevista da bola
		distance_to_predict = predicted_y - paddle_y
		distance_penalty = abs(distance_to_predict) ** 0.5
		speed_penalty = ball_speed * 0.1
		proximity_penalty = (1 / abs(distance_x)) * 0.5 if distance_x != 0 else 0.1

		if 0 <= distance_to_predict < int(PADDLE_HEIGHT_DUO / PongBot.REDUCTION):
			return 50 - (distance_to_predict * 2)  # Alta recompensa por interceptar a bola corretamente

		if 0 <= distance_x < 4 * (GAME_WIDTH / PongBot.REDUCTION):  # Bola está muito próxima da raquete
			return -10 - 1.5 * distance_penalty - speed_penalty

		return -1 - distance_penalty - speed_penalty - proximity_penalty


	async def calculate_state(self, ball_x, ball_y, ball_v_x, ball_v_y, paddle_x, paddle_y):
		direction = 1 if ball_v_x > 0 else -1
		distance_x = round(((paddle_x - ball_x) * direction) / PongBot.REDUCTION)
		distance_y = round((paddle_y - ball_y) / PongBot.REDUCTION)
		ball_speed = round((ball_v_x ** 2 + ball_v_y ** 2) ** 0.5)

		return (distance_x, distance_y, ball_speed, round(paddle_y / PongBot.REDUCTION))

	async def get_state(self):
		serialize = await self.game.serialize()
		paddle_pos = serialize['players'][f'player{self.player}']['pos']
		ball = serialize['ball']
		self.raw_pos = paddle_pos['y']
		score = serialize['left_score']
		self.defeat = True if score != self.losses else False
		self.losses = score
		state = await self.calculate_state(ball['x'], ball['y'], ball['x_vel'], ball['y_vel'], paddle_pos['x'], paddle_pos['y'])

		self.test['get_state'] = [paddle_pos, ball, state]
		return state

	async def testing(self, state, action, reward):
		if self.training:
			return
		self.states.append([state, (self.raw_pos, int(self.raw_pos / PongBot.REDUCTION), round(self.raw_pos / PongBot.REDUCTION))])
		self.actions.append(action)
		self.rewards.append(reward)
		serialize = await self.game.serialize()
		paddle_pos = serialize['players'][f'player{self.player}']['pos']
		ball = serialize['ball']
		if ball['x'] >= 580 or ball['x'] <= 20:
			if ball['x'] >= 580:
				self.test['prediction'][1] = round(ball['y'] / PongBot.REDUCTION)
			new_state = await self.calculate_state(ball['x'], ball['y'], ball['x_vel'], ball['y_vel'], paddle_pos['x'], paddle_pos['y'])
			# print(f"\n\n\nq-table size => {len(PongBot.q_table)}\nstate => {self.states}\naction => {self.actions}\nnew_state => {new_state}\nreward => {self.rewards}\ntest => {self.test}\n\n\n")
			bla = [v for v in PongBot.q_table.values() if (v[-1] or v[0] or v[1])]
			# print('\n\n\n\neu nao')
			results = [[self.states[i], act, self.rewards[i], self.test['prediction'][0][i]] for i, act in enumerate(self.actions)]
			print(f"\n\n\nq-table size => {len(PongBot.q_table)} | {len(bla)}\nresults => {results}\nball pos => {self.test['prediction'][1]}\nnew_state => {new_state}\n\n\n")
			self.test['prediction'] = [[], None]
			self.states = []
			self.rewards = []
			self.actions = []
		


	async def choose_action(self, state):
		self.test['choose_action'] = 'q-table'
		exploration_limit = 0.1 if self.training else PongBot.EPSILON
		if random.uniform(0, 1) < exploration_limit:
			return random.choice(PongBot.actions)
		if state not in PongBot.q_table:
			predicted_y = await self.predict_ball_position(state)
			return -1 if predicted_y < state[-1] else 1 if predicted_y > state[-1] else 0
		# if not PongBot.q_table.get(state):
		# 	if state[0] < 0:
		# 		return 0 
		# 	predicted_y = await self.predict_ball_position(state)
		# 	distance = predicted_y - state[-1]
		# 	self.test['choose_action'] = [distance, predicted_y, state[-1]]
		# 	if distance < 0:
		# 		return -1
		# 	# if distance < (PADDLE_HEIGHT_DUO / PongBot.REDUCTION):
		# 	# 	return 0
		# 	if distance > 0:
		# 		return 1
		# # else:
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
			try:
				curr_time = time.time()
				if curr_time - last_time >= refresh_rate:
					new_state = await self.get_state()
					action = await self.continuous_paddle_mov(new_state)
					reward = await self.get_reward(state, new_state)
					self.history.append([state, action, reward, new_state])
					change = (state[0] > 0 and new_state[0] <= 0) or (state[0] < 0 and new_state[0] >= 0)
					if self.defeat or change:
						self.history[0][-1] = new_state
						self.defeat = False
						await self.update_q_table_n_steps()
					# await self.testing(state, action, reward)
					# if not self.training:
					# 	print(f"\n\n\nq-table size => {len(PongBot.q_table)}\nstate => {states}\naction => {action}\nnew_state => {new_state}\nreward => {reward}\ntest => {self.test}\n\n\n")
					# 	if self.test['prediction'][1]:
					# 		self.test['prediction'] = [[], None]
					# 		states = []
					last_time = curr_time
					state = new_state
				action = await self.continuous_paddle_mov(state)
				
				self.raw_pos = max(0, min(GAME_HEIGHT, self.raw_pos + action * PADDLE_START_VEL))
				new_state = state[:-1] + (int(self.raw_pos / PongBot.REDUCTION),)


				reward = await self.get_reward(state, new_state)
				self.history.append([state, action, reward, new_state])
				# await self.testing(state, action, reward)
				state = new_state

				await asyncio.sleep(sleep_rate)
			except Exception as e:
				logger.error(f'Error in bot_loop: {str(e)}', exc_info=True)

	async def launch_bot(self):
		if not PongBot.instances:
			PongBot.q_table = await sync_to_async(self.bot_db.load_table)()
			PongBot.q_table['teste'] = {0: 0, 1: 0, -1: 0}
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
