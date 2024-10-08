import random
import asyncio
import time
from asgiref.sync import sync_to_async

from configFiles.globals import *
from ..models import *

class PongBot():
	instances = 0
	q_table = {}
	REDUCTION = 70
	ALPHA = 0.1 #learning rate
	GAMMA = 0.85 #discount factor
	EPSILON = 0.1 #exploration rate
	actions = [-1, 0, 1] #moves [up, nothing, down]


	def __init__(self, game, player, bot_db, training=False):
		self.training = training
		self.bot_db = bot_db
		self.game = game
		self.player = player
		self.history = []

		self.raw_pos = None


	async def update_q_table_n_steps(self):
		if not len(self.history):
			return

		g_reward = 0
		first_node = len(self.history) - 1
		for i, (state, action, reward, new_state) in enumerate(reversed(self.history)):
			g_reward = reward + PongBot.GAMMA * g_reward
			if i == first_node:

				if state not in PongBot.q_table:
					PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

				old_value = PongBot.q_table[state][action]
				future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
				new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
				PongBot.q_table[state][action] = new_value

		self.history = []

	async def update_q_table(self, state, action, reward, new_state):
		if state not in PongBot.q_table:
			PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

		old_value = PongBot.q_table[state][action]
		future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
		new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (reward + PongBot.GAMMA * future_max)
		PongBot.q_table[state][action] = new_value

	async def predict_ball_position(self, ball_x, ball_y, ball_v_x, ball_v_y, paddle_x):
		height = GAME_HEIGHT // PongBot.REDUCTION

		# Verifica se a bola está indo na direção da raquete
		if ball_v_x == 0 or paddle_x <= ball_x:
			return ball_y  # A bola não está indo em direção à raquete ou está parada

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

		return predicted_y

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

		# TODO new reward based in the new state
		pass

# TODO test the data
	async def get_state(self):
		serialize = await self.game.serialize()
		paddle_pos = serialize['players'][f'player{self.player}']['pos']
		self.raw_pos = paddle_pos['y']
		ball = serialize['ball']
		direction = 1 if ball['x_vel'] > 0 else -1
		distance_x = (paddle_pos['x'] - ball['x']) * direction
		distance_y = paddle_pos['y'] - ball['y']
		ball_speed = (ball['x_vel']**2 + ball['y_vel']**2) ** 0.5
		# ball['x'] = ball['x'] // PongBot.REDUCTION
		# ball['y'] = ball['y'] // PongBot.REDUCTION
		# ball['x_vel'] = round(ball['x_vel'])
		# ball['y_vel'] = round(ball['y_vel'])


		# paddle_pos['x'] = paddle_pos['x'] // PongBot.REDUCTION
		# paddle_pos['y'] = paddle_pos['y'] // PongBot.REDUCTION

		print(f"\n\n\ntest state\ndistance x => {distance_x // PongBot.REDUCTION}\ndistance y => {distance_y // PongBot.REDUCTION}\nball speed => {ball_speed // MAX_VEL}\npaddle y => {paddle_pos['y'] // PongBot.REDUCTION}")
		return (distance_x // PongBot.REDUCTION, distance_y // PongBot.REDUCTION, ball_speed // MAX_VEL, paddle_pos['y'] // PongBot.REDUCTION)

		# return (ball['x'], ball['y'], ball['x_vel'], ball['y_vel'], paddle_pos['x'], paddle_pos['y'])
	
	async def update_state(self, state, action):
		y_min = 0
		y_max = GAME_HEIGHT // PongBot.REDUCTION
		ball_x, ball_y, ball_v_x, ball_v_y, paddle_x, paddle_y = state
		paddle_y += action * 0.25
		ball_x += ball_v_x
		ball_y += ball_v_y
		if not self.training:
			ball_x += ball_v_x
			ball_y += ball_v_y
		if ball_y < y_min:
			ball_y *= -1
		if ball_y > y_max:
			ball_y = 2 * y_max - ball_y

		return (ball_x, ball_y, ball_v_x, ball_v_y, paddle_x, paddle_y)

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
		refresh_rate = 1 if not self.training else 0.25
		sleep_rate = SLEEP * 2 if not self.training else SLEEP / 4
		while True:
			curr_time = time.time()
			if curr_time - last_time >= refresh_rate:
				new_state = await self.get_state()
				await self.update_q_table(state, action, reward, new_state)
				# for step in self.history:
				# 	step[-1] = new_state
				# await self.update_q_table_n_steps()
				last_time = curr_time
				state = new_state
			action = await self.continuous_paddle_mov(state)
			
			self.raw_pos += action * PADDLE_START_VEL
			new_state = state[:-1] + (self.raw_pos // PongBot.REDUCTION,)



			reward = await self.get_reward(state, action)
			await self.update_q_table(state, action, reward, new_state)
			# self.history.append([state, action, reward, state])
			# state = await self.update_state(state, action)
			state = new_state

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
