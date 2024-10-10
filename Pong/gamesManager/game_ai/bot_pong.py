import random
import asyncio
import time
from asgiref.sync import sync_to_async

from configFiles.globals import *
from ..models import *

class PongBot():
	instances = 0
	q_table = {}
	REDUCTION = 5
	ALPHA = 0.2 #learning rate
	GAMMA = 0.65 #discount factor
	EPSILON = 0.1 #exploration rate
	actions = [-1, 0, 1] #moves [up, nothing, down]


	def __init__(self, game, player, bot_db, training=False):
		self.training = training
		self.bot_db = bot_db
		self.game = game
		self.player = player
		self.history = []
		self.raw_pos = None
		self.raw_pos_all = []

		self.test_reward = []


	async def update_q_table_n_steps(self):
		if not len(self.history):
			return
		rewards = []
		g_reward = 0
		first_node = len(self.history) - 1
		for i, (state, action, reward, new_state) in enumerate(reversed(self.history)):
			g_reward = reward + PongBot.GAMMA * g_reward
			rewards.append(reward)
			if i == first_node:

				if state not in PongBot.q_table:
					PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

				old_value = PongBot.q_table[state][action]
				future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
				new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
				PongBot.q_table[state][action] = new_value
		self.test_reward = [min(rewards), sum(rewards) / float(len(rewards)), max(rewards)]
		self.history = []

	async def update_q_table(self, state, action, reward, new_state):
		if state not in PongBot.q_table:
			PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

		old_value = PongBot.q_table[state][action]
		future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
		new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (reward + PongBot.GAMMA * future_max)
		PongBot.q_table[state][action] = new_value

	async def predict_ball_position(self, state):
		height = GAME_HEIGHT // PongBot.REDUCTION
		ball_x, ball_y, ball_v_x, ball_v_y, paddle_x = self.raw_pos_all
		distance_x, distance_y, ball_speed, paddle_y = state

		# Verifica se a bola está indo na direção da raquete
		if ball_v_x == 0 or distance_x < 0:
			return paddle_y  # A bola não está indo em direção à raquete ou está parada

		# Tempo para a bola chegar à posição X da raquete
		time_to_reach_paddle = (paddle_x - ball_x) / ball_v_x

		# Estima onde a bola estará no eixo Y após esse tempo
		predicted_y = ball_y + ball_v_y * time_to_reach_paddle

		# Considera os rebotes nas bordas superior e inferior
		while predicted_y < 0 or predicted_y > height:
			if predicted_y < 0:
				predicted_y = -predicted_y  # Rebote na borda superior
			elif predicted_y > height:
				predicted_y = 2 * height - predicted_y  # Rebote na borda inferior

		return predicted_y // PongBot.REDUCTION

	async def get_reward(self, state, action):
		# ball_x, ball_y, ball_v_x, ball_v_y, paddle_x, paddle_y = state

		# # Prediz onde a bola vai bater na linha da raquete
		# predicted_y = await self.predict_ball_position(ball_x, ball_y, ball_v_x, ball_v_y, paddle_x)

		# # Calcula a distância entre a raquete e a posição prevista da bola
		# distance_to_ball = abs(predicted_y - paddle_y)# // PongBot.REDUCTION)

		# # Penalização mais severa com base na velocidade da bola
		# ball_speed = (ball_v_x**2 + ball_v_y**2) ** 0.5  # Velocidade total da bola
		# distance_penalty = distance_to_ball * ball_speed / 10  # Ajustar divisor conforme necessário

		# # Atribui recompensa ou penalidade com base na ação
		# if distance_to_ball == 0:
		# 	return 50  # Recompensa máxima se a raquete estiver alinhada perfeitamente com a bola
		# elif (distance_to_ball > 0 and action == 1) or (distance_to_ball < 0 and action == -1):
		# 	return 1 - distance_penalty  # Pequena recompensa, mas com penalidade baseada na distância e velocidade
		# else:
		# 	return -1 - distance_penalty  # Penalidade maior se a ação for incorreta


		distance_x, distance_y, ball_speed, paddle_y = state
		predicted_y = await self.predict_ball_position(state)

		# Recompensa baseada em quão perto a raquete está da posição prevista da bola
		distance_penalty = abs(predicted_y - paddle_y)
		speed_penalty = ball_speed * 0.1
		proximity_penalty = 1 / abs(distance_x) if distance_x != 0 else 0.1

		if distance_penalty < 1:
			return 100 - speed_penalty  # Alta recompensa por interceptar a bola corretamente

		return -1 - distance_penalty - speed_penalty - proximity_penalty


		# height = GAME_HEIGHT // PongBot.REDUCTION
		# distance_x, distance_y, ball_speed, paddle_y = state
		# paddle_limit = -(PADDLE_HEIGHT_DUO // PongBot.REDUCTION)
		# # # Se a bola está muito longe, a prioridade do alinhamento vertical é menor
		# # if distance_x > 1:
		# # 	return 0  # Sem penalidade/recompensa significativa enquanto a bola está longe
		# if not ball_speed:
		# 	return 0
		# # Penalidade pela distância da bola no eixo Y (quanto menor a distância, melhor)
		# distance_penalty = abs(distance_y) * 0.1

		# # Penalidade pela velocidade da bola (quanto maior a velocidade, mais difícil interceptar)
		# speed_penalty = ball_speed * 0.1  # Ajuste o fator conforme necessário

		# # Penalidade adicional se a bola estiver perto (distance_x pequeno)
		# distance = distance_x if distance_x else 0.1
		# proximity_penalty = 1 / distance  # Penalidade aumenta conforme a bola se aproxima

		# # Recompensa máxima se o paddle está bem alinhado verticalmente com a bola
		# if paddle_limit >= distance_y <= 0 and abs(distance_x) <= 2:
		# 	if not action and paddle_limit + 2 >= distance_y <= -2:
		# 		return 100
		# 	return 50  # Recompensa alta para alinhamento perfeito e bola próxima
		# if distance_x < 0:
		# 	quarter = height // 4
		# 	if quarter < paddle_y < height - quarter:
		# 		return 1
		# 	return 0
		# # Pequena recompensa se a ação está na direção correta e a bola está se aproximando
		# if (distance_y > 0 and action == -1) or (distance_y < 0 and action == 1):
		# 	return 10 - distance_penalty - speed_penalty - proximity_penalty  # Pequena recompensa com penalidades

		# # Penalidade maior para ação incorreta conforme a bola se aproxima
		# return -1 - distance_penalty - speed_penalty - proximity_penalty


	async def calculate_state(self, ball_x, ball_y, ball_v_x, ball_v_y, paddle_x, paddle_y):
		direction = 1 if ball_v_x > 0 else -1
		distance_x = ((paddle_x - ball_x) * direction) // PongBot.REDUCTION
		distance_y = (paddle_y - ball_y) // PongBot.REDUCTION
		ball_speed = round((ball_v_x ** 2 + ball_v_y ** 2) ** 0.5)

		return (distance_x, distance_y, ball_speed, paddle_y // PongBot.REDUCTION)

# TODO test the data
	async def get_state(self):
		serialize = await self.game.serialize()
		paddle_pos = serialize['players'][f'player{self.player}']['pos']
		ball = serialize['ball']
		self.raw_pos = paddle_pos['y']
		self.raw_pos_all = [ball['x'], ball['y'], ball['x_vel'], ball['y_vel'], paddle_pos['x']]
		state = await self.calculate_state(ball['x'], ball['y'], ball['x_vel'], ball['y_vel'], paddle_pos['x'], paddle_pos['y'])
		# direction = 1 if ball['x_vel'] > 0 else -1
		# distance_x = ((paddle_pos['x'] - ball['x']) * direction) // PongBot.REDUCTION
		# distance_y = (paddle_pos['y'] - ball['y']) // PongBot.REDUCTION
		# ball_speed = round((ball['x_vel']**2 + ball['y_vel']**2) ** 0.5)
		# ball['x'] = ball['x'] // PongBot.REDUCTION
		# ball['y'] = ball['y'] // PongBot.REDUCTION
		# ball['x_vel'] = round(ball['x_vel'])
		# ball['y_vel'] = round(ball['y_vel'])


		# paddle_pos['x'] = paddle_pos['x'] // PongBot.REDUCTION
		# paddle_pos['y'] = paddle_pos['y'] // PongBot.REDUCTION

		# distance_penalty = abs(distance_y) * 0.1

		# speed_penalty = ball_speed * 0.1  # Ajuste o fator conforme necessário

		# distance = distance_x if distance_x else 0.1
		# proximity_penalty = 1 / distance  # Penalidade aumenta conforme a bola se aproxima


		# recompensa = 10 - distance_penalty - speed_penalty - proximity_penalty  # Pequena recompensa com penalidades

		# penalidade = -1 - distance_penalty - speed_penalty - proximity_penalty

		# print(f"\n\n\ntest state\nball => {ball}\npaddle => {paddle_pos}\ndistance x => {distance_x}\ndistance y => {distance_y}\nball speed => {ball_speed} | {ball_speed / MAX_VEL} | {round(ball_speed)} | {int(ball_speed)}\npaddle y => {paddle_pos['y'] // PongBot.REDUCTION}\nspeed penalty => {speed_penalty}\nproximity penalty => {proximity_penalty}\nrecompensa => {recompensa}\npenalidade => {penalidade}\nmedia de recompensas => {self.test_reward}")
		return state

		# return (ball['x'], ball['y'], ball['x_vel'], ball['y_vel'], paddle_pos['x'], paddle_pos['y'])

	async def update_state(self, state, action):
		y_min = 0
		y_max = GAME_HEIGHT // PongBot.REDUCTION
		self.raw_pos += action * PADDLE_START_VEL
		# paddle_y = self.raw_pos // PongBot.REDUCTION
		self.raw_pos_all[0] += (self.raw_pos_all[2] + self.raw_pos_all[2])
		# print("\n\n\nHAHAHAHA\n\n\n")
		self.raw_pos_all[1] += (self.raw_pos_all[3] + self.raw_pos_all[3])
		# if not self.training:
		# 	ball_x += ball_v_x
		# 	ball_y += ball_v_y
		if self.raw_pos_all[1] < y_min:
			self.raw_pos_all[1] *= -1
		if self.raw_pos_all[1] > y_max:
			self.raw_pos_all[1] = 2 * y_max - self.raw_pos_all[1]
		ball_x, ball_y, ball_v_x, ball_v_y, paddle_x = self.raw_pos_all
		state = await self.calculate_state(ball_x, ball_y, ball_v_x, ball_v_y, paddle_x, self.raw_pos)

		return state
		# return (ball_x, ball_y, ball_v_x, ball_v_y, paddle_x, paddle_y)

	async def choose_action(self, state):
		if random.uniform(0, 1) < PongBot.EPSILON or not PongBot.q_table.get(state):
			return random.choice(PongBot.actions)
		else:
			return max(PongBot.q_table.get(state, {a: 0 for a in PongBot.actions}),
			  key=PongBot.q_table.get(state, {a: 0 for a in PongBot.actions}).get)

	async def continuous_paddle_mov(self, state):
		action = await self.choose_action(state)
		if action:
			player_move = {'player': self.player, 'direction': action}
			await self.game.move_player_paddle(player_move)

		return action

	# async def bot_loop(self):
	# 	if not self.training:
	# 		last_time = time.time()
	# 		state = await self.get_state()
	# 		refresh_rate = 1
	# 		sleep_rate = SLEEP * 2
	# 		while True:
	# 			curr_time = time.time()
	# 			if curr_time - last_time >= refresh_rate:
	# 				new_state = await self.get_state()
	# 				await self.update_q_table(state, action, reward, new_state)
	# 				last_time = curr_time
	# 				state = new_state
	# 			action = await self.continuous_paddle_mov(state)
	# 			reward = await self.get_reward(state, action)
	# 			state = await self.update_state(state, action)

	# 			await asyncio.sleep(sleep_rate)
	# 	else:
	# 		while True:
	# 			state = await self.get_state()
	# 			action = await self.continuous_paddle_mov(state)
	# 			reward = await self.get_reward(state, action)
	# 			new_state = await self.get_state()
	# 			await self.update_q_table(state, action, reward, new_state)
	async def bot_loop(self):
		last_time = time.time()
		state = await self.get_state()
		refresh_rate = 1 #if not self.training else 0.5
		sleep_rate = SLEEP * 2 #if not self.training else SLEEP / 2
		while True:
			curr_time = time.time()
			if curr_time - last_time >= refresh_rate:
				new_state = await self.get_state()
				action = await self.continuous_paddle_mov(state)
				reward = await self.get_reward(new_state, action)
				self.history.append([state, action, reward, new_state])
				# await self.update_q_table(state, action, reward, new_state)
				# for step in self.history:
				# 	step[-1] = new_state
				self.history[0][-1] = new_state
				# self.history[-1][-1] = state
				await self.update_q_table_n_steps()
				last_time = curr_time
				state = new_state
			action = await self.continuous_paddle_mov(state)

			self.raw_pos += action * PADDLE_START_VEL
			new_state = state[:-1] + (self.raw_pos // PongBot.REDUCTION,)
			# new_state = await self.update_state(state, action)


			reward = await self.get_reward(new_state, action)
			# await self.update_q_table(state, action, reward, new_state)
			self.history.append([state, action, reward, new_state])
			# state = await self.update_state(state, action)
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
