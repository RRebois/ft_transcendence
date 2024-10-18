#	###			version 1		### #
# import random
# import asyncio
# import time
# import math
# from asgiref.sync import sync_to_async

# from configFiles.globals import *
# from ..models import *


# import logging
# logging.basicConfig(level=logging.ERROR)
# logger = logging.getLogger(__name__)


# class PongBot():
# 	instances = 0
# 	q_table = {}
# 	REDUCTION = 10
# 	ALPHA = 0.55 #learning rate
# 	GAMMA = 0.7 #discount factor
# 	EPSILON = 0.05 #exploration rate
# 	EPSILON_TRAIN = 0.35 #exploration rate
# 	actions = [-1, 0, 1] #moves [up, nothing, down]


# 	def __init__(self, game, player, bot_db, training=False):
# 		self.training = training
# 		self.bot_db = bot_db
# 		self.game = game
# 		self.player = player
# 		self.history = []
# 		self.raw_pos = None
# 		self.losses = 0
# 		self.defeat = False
# 		self.epsilon = PongBot.EPSILON_TRAIN if self.training else PongBot.EPSILON
# 		self.farest = int((GAME_WIDTH / 4 ) * 3)#13 26 40 (max = 60) 15 30 45 | 11 22 45
# 		self.mid = int(self.farest / 2)
# 		self.closest = int(self.mid / 2)
# # 000000000001111111111122222222222222222222222333333333333333
# # 000000000000000111111111111111222222222222222333333333333333
# # 000000000000011111111111112222222222222233333333333333333333
# # v3
# 	async def update_q_table_n_steps(self):
# 		if not len(self.history):
# 			return
# 		g_reward = 0
# 		first_node = len(self.history) - 1
# 		for state, action, reward, new_state in reversed(self.history):
# 			g_reward = reward + PongBot.GAMMA * g_reward
# 			if state != new_state:
# 				if state not in PongBot.q_table:
# 					PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

# 				old_value = PongBot.q_table[state][action]
# 				future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
# 				new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
# 				PongBot.q_table[state][action] = new_value
# 		self.history = []

# # # v2
# # 	async def update_q_table_n_steps(self):
# # 		if not len(self.history):
# # 			return
# # 		g_reward = 0
# # 		for state, action, reward, new_state in reversed(self.history):
# # 			g_reward = reward + PongBot.GAMMA * g_reward
# # 			if state not in PongBot.q_table:
# # 				PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

# # 			old_value = PongBot.q_table[state][action]
# # 			future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
# # 			new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
# # 			PongBot.q_table[state][action] = new_value
# # 		self.history = []

# # v1
# # 	async def update_q_table_n_steps(self):
# # 		if not len(self.history):
# # 			return
# # 		g_reward = 0
# # 		first_node = len(self.history) - 1
# # 		for state, action, reward, new_state in self.history:
# # 			g_reward = reward + PongBot.GAMMA * g_reward

# # 			if state not in PongBot.q_table:
# # 				PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

# # 			old_value = PongBot.q_table[state][action]
# # 			future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
# # 			new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
# # 			PongBot.q_table[state][action] = new_value
# # 		self.history = []

# # v0
# 	# async def update_q_table_n_steps(self):
# 	# 	if not len(self.history):
# 	# 		return
# 	# 	g_reward = 0
# 	# 	first_node = len(self.history) - 1
# 	# 	for i, (state, action, reward, new_state) in enumerate(reversed(self.history)):
# 	# 		g_reward = reward + PongBot.GAMMA * g_reward
# 	# 		if state[0] != new_state[0]:

# 	# 			if state not in PongBot.q_table:
# 	# 				PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

# 	# 			old_value = PongBot.q_table[state][action]
# 	# 			future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
# 	# 			new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
# 	# 			PongBot.q_table[state][action] = new_value
# 	# 	self.history = []

# 	async def predict_ball_position(self, state):
# 		ball_x, ball_y, ball_v_x, ball_v_y = state[0]
# 		paddle_x, paddle_y = state[1]
# 		if not ball_v_x:
# 			return paddle_y
# 		if (self.player == 2 and ball_v_x < 0) or (self.player == 1 and ball_v_x > 0):
# 			return GAME_HEIGHT // 2
# 		pos_x = paddle_x
# 		while (self.player == 2 and ball_x < pos_x) or (self.player == 1 and ball_x > pos_x):
# 			ball_x += ball_v_x
# 			ball_y += ball_v_y
# 			if ball_y <= 0 or ball_y >= GAME_HEIGHT:
# 				ball_v_y *= -1
# 				ball_y = max(0, min(ball_y, GAME_HEIGHT))

# 		# return int(ball_y / PongBot.REDUCTION)
# 		return ball_y

# 	async def get_reward(self, state, new_state):
# 		old_ball_x, old_ball_y, old_ball_v_x, old_ball_v_y = state[0]
# 		old_paddle_x, old_paddle_y = state[1]
# 		new_ball_x, new_ball_y, new_ball_v_x, new_ball_v_y = new_state[0]
# 		new_paddle_x, new_paddle_y = new_state[1]

# 		old_predicted_y = await self.predict_ball_position(state)
# 		new_predicted_y = await self.predict_ball_position(new_state)

# 		old_distance_to_predict = abs(old_predicted_y - old_paddle_y)
# 		new_distance_to_predict = abs(new_predicted_y - new_paddle_y)

# 		reward = old_distance_to_predict - new_distance_to_predict
# 		is_closer = (self.player == 2 and new_ball_x > old_ball_x) or (self.player == 1 and new_ball_x < old_ball_x)

# 		if self.defeat:
# 			self.defeat = False
# 			return reward - 200 - (old_distance_to_predict * 0.5) # Penalidade alta por perder um ponto

# 		if (self.player == 2 and old_ball_v_x > 0 and new_ball_v_x < 0) or (self.player == 1 and old_ball_v_x < 0 and new_ball_v_x > 0):
# 			return reward + 100  # Recompensa alta por rebater a bola

# 		if new_distance_to_predict < PADDLE_HEIGHT_DUO:
# 			reward += 50 - new_distance_to_predict  # Recompensa por estar próximo à posição prevista

# 		# Small reward for moving towards the ball when it's approaching
# 		if is_closer and new_distance_to_predict < old_distance_to_predict:
# 			reward += 10

# 		# Penalty for moving away from the predicted position when the ball is approaching
# 		if is_closer and new_distance_to_predict > old_distance_to_predict:
# 			reward -= 10

# 		# Adjust reward based on ball speed (higher speed = higher stakes)
# 		reward *= (1 + abs(new_ball_v_x) / 10)

# 		return reward

# 	async def calculate_state(self, state):
# 		ball_x, ball_y, ball_v_x, ball_v_y = state[0]
# 		paddle_x, paddle_y = state[1]
# 		# direction = 1 if ball_v_x > 0 else -1
# 		direction = 1 if self.player == 2 else -1
# 		distance_x = int(paddle_x - ball_x) * direction
# 		distance_y = int(paddle_y - ball_y)
# 		distance_y = -1 if distance_y > 0 else 1 if distance_y < -PADDLE_HEIGHT_DUO else 0
# 		distance_x = 0 if distance_x < self.closest else 1 if distance_x < self.mid else 2 if distance_x < self.farest else 3
# 		# distance_x = int(((paddle_x - ball_x) * direction) / PongBot.REDUCTION)
# 		# distance_y = int((paddle_y - ball_y) / PongBot.REDUCTION)
# 		ball_speed = int((ball_v_x ** 2 + ball_v_y ** 2) ** 0.5)
# 		ball_speed = 0 if ball_speed <= 2 else 1 if ball_speed < 5 else 2

# 		return (distance_x, distance_y, ball_speed, int(paddle_y / PongBot.REDUCTION))

# 	async def get_state(self):
# 		serialize = await self.game.serialize()
# 		paddle_pos = serialize['players'][f'player{self.player}']['pos']
# 		ball = serialize['ball']
# 		self.raw_pos = paddle_pos['y']
# 		score = serialize['left_score']
# 		self.defeat = True if score != self.losses else False
# 		self.losses = score
# 		state = [[ball['x'], ball['y'], ball['x_vel'], ball['y_vel']], [paddle_pos['x'], paddle_pos['y']]]

# 		return state

# 	async def choose_action(self, state):
# 		# exploration_limit = PongBot.EPSILON_TRAIN if self.training else PongBot.EPSILON
# 		self.epsilon = self.epsilon if not self.training else max(PongBot.EPSILON, self.epsilon * 0.99)
# 		if random.uniform(0, 1) < self.epsilon:
# 			return random.choice(PongBot.actions)
# 		if random.uniform(0, 1) < self.epsilon:
# 			predicted_y = await self.predict_ball_position(state)
# 			return -1 if predicted_y < state[-1][-1] else 1 if predicted_y > (state[-1][-1] + PADDLE_HEIGHT_DUO) else 0
# 		state_key = await self.calculate_state(state)
# 		if state_key not in PongBot.q_table:
# 			return 0
# 		return max(PongBot.q_table.get(state_key, {a: 0 for a in PongBot.actions}),
# 			  key=PongBot.q_table.get(state_key, {a: 0 for a in PongBot.actions}).get)

# 	async def continuous_paddle_mov(self, state):
# 		action = await self.choose_action(state)
# 		if action:
# 			player_move = {'player': self.player, 'direction': action}
# 			await self.game.move_player_paddle(player_move)

# 		return action

# 	async def bot_loop(self):
# 		last_time = time.time()
# 		state = new_state = await self.get_state()
# 		refresh_rate = 1 if not self.training else 0.5
# 		sleep_rate = SLEEP * 4 if not self.training else SLEEP * 2
# 		while True:
# 			try:
# 				curr_time = time.time()
# 				if curr_time - last_time >= refresh_rate:
# 					new_state = await self.get_state()
# 					# action = await self.continuous_paddle_mov(state)
# 					# reward = await self.get_reward(state, new_state)
# 					# state_key = await self.calculate_state(state)
# 					# new_state_key = await self.calculate_state(new_state)
# 					# self.history.append([state_key, action, reward, new_state_key])
# 					# change = (state[0][2] > 0 and new_state[0][2] < 0) or (state[0][2] < 0 and new_state[0][2] > 0) or new_state[0][2] == 0
# 					# if self.defeat or change:
# 						# self.defeat = False
# 					last_time = curr_time
# 					# state = new_state
# 				action = await self.continuous_paddle_mov(state)
# 				if state[0] == new_state[0]:
# 					self.raw_pos = max(0, min(GAME_HEIGHT, self.raw_pos + action * PADDLE_START_VEL))
# 					new_state = state
# 					new_state[-1][-1] = self.raw_pos

# 				reward = await self.get_reward(state, new_state)
# 				state_key = await self.calculate_state(state)
# 				new_state_key = await self.calculate_state(new_state)
# 				self.history.append([state_key, action, reward, new_state_key])
# 				if last_time == curr_time:
# 					self.history[0][-1] = new_state_key
# 					await self.update_q_table_n_steps()

# 				state = new_state

# 				await asyncio.sleep(sleep_rate)
# 			except Exception as e:
# 				logger.error(f'Error in bot_loop: {str(e)}', exc_info=True)

# 	async def launch_bot(self):
# 		if not PongBot.instances:
# 			PongBot.q_table = await sync_to_async(self.bot_db.load_table)()
# 		PongBot.instances += 1
# 		self.loop_task = asyncio.create_task(self.bot_loop())

# 	async def cancel_loop(self):
# 		if hasattr(self, 'loop_task'):
# 			self.loop_task.cancel()
# 			PongBot.instances -= 1
# 		if not PongBot.instances:
# 			await self.update_table_to_db()
# 			print(f'\ntable => {PongBot.q_table}')

# 	@sync_to_async
# 	def	update_table_to_db(self):
# 		self.bot_db.save_table(PongBot.q_table)

#	###			version 2		### #
# import random
# import asyncio
# import time
# import math
# from asgiref.sync import sync_to_async

# from configFiles.globals import *
# from ..models import *


# import logging
# logging.basicConfig(level=logging.ERROR)
# logger = logging.getLogger(__name__)


# class PongBot():
# 	instances = 0
# 	q_table = {}
# 	REDUCTION = 10
# 	ALPHA = 0.55 #learning rate
# 	GAMMA = 0.7 #discount factor
# 	EPSILON = 0.03 #exploration rate
# 	EPSILON_TRAIN = 0.35 #exploration rate
# 	actions = [-1, 0, 1] #moves [up, nothing, down]


# 	def __init__(self, game, player, bot_db, training=False):
# 		self.training = training
# 		self.bot_db = bot_db
# 		self.game = game
# 		self.player = player
# 		self.history = []
# 		self.raw_pos = None
# 		self.losses = 0
# 		self.defeat = False
# 		self.epsilon = PongBot.EPSILON_TRAIN if self.training else PongBot.EPSILON
# 		self.farest = int((GAME_WIDTH / 4 ) * 3)
# 		self.mid = int(self.farest / 2)
# 		self.closest = int(self.mid / 2)

# # v3
# 	async def update_q_table_n_steps(self):
# 		if not len(self.history):
# 			return
# 		g_reward = 0
# 		for state, action, reward, new_state in reversed(self.history):
# 			g_reward = reward + PongBot.GAMMA * g_reward
# 			if state != new_state:
# 				if state not in PongBot.q_table:
# 					PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

# 				old_value = PongBot.q_table[state][action]
# 				future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
# 				new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
# 				PongBot.q_table[state][action] = new_value
# 		self.history = []


# 	async def predict_ball_position(self, state):
# 		ball_x, ball_y, ball_v_x, ball_v_y = state[0]
# 		paddle_x, paddle_y = state[1]
# 		if not ball_v_x:
# 			return paddle_y
# 		if (self.player == 2 and ball_v_x < 0) or (self.player == 1 and ball_v_x > 0):
# 			return GAME_HEIGHT // 2
# 		pos_x = paddle_x
# 		while (self.player == 2 and ball_x < pos_x) or (self.player == 1 and ball_x > pos_x):
# 			ball_x += ball_v_x
# 			ball_y += ball_v_y
# 			if ball_y <= 0 or ball_y >= GAME_HEIGHT:
# 				ball_v_y *= -1
# 				ball_y = max(0, min(ball_y, GAME_HEIGHT))

# 		return ball_y

# 	async def get_reward(self, state, new_state):
# 		old_ball_x, old_ball_y, old_ball_v_x, old_ball_v_y = state[0]
# 		old_paddle_x, old_paddle_y = state[1]
# 		new_ball_x, new_ball_y, new_ball_v_x, new_ball_v_y = new_state[0]
# 		new_paddle_x, new_paddle_y = new_state[1]

# 		old_predicted_y = await self.predict_ball_position(state)
# 		new_predicted_y = await self.predict_ball_position(new_state)

# 		old_distance_to_predict = abs(old_predicted_y - old_paddle_y)
# 		new_distance_to_predict = abs(new_predicted_y - new_paddle_y)

# 		is_closer = (self.player == 2 and new_ball_x > old_ball_x) or (self.player == 1 and new_ball_x < old_ball_x)

# 		if self.defeat:
# 			self.defeat = False
# 			return -200 # Penalidade alta por perder um ponto

# 		if (self.player == 2 and old_ball_v_x > 0 and new_ball_v_x < 0) or (self.player == 1 and old_ball_v_x < 0 and new_ball_v_x > 0):
# 			return 100  # Recompensa alta por rebater a bola

# 		if new_distance_to_predict <= PADDLE_HEIGHT_DUO and new_predicted_y > new_paddle_y:
# 			return 50  # Recompensa por estar próximo à posição prevista

# 		# Small reward for moving towards the ball when it's approaching
# 		if is_closer and new_distance_to_predict < old_distance_to_predict:
# 			return 10

# 		# Penalty for moving away from the predicted position when the ball is approaching
# 		if is_closer and new_distance_to_predict > old_distance_to_predict:
# 			return -10

# 		return 0

# 	async def calculate_state(self, state):
# 		ball_x, ball_y, ball_v_x, ball_v_y = state[0]
# 		paddle_x, paddle_y = state[1]
# 		direction = 1 if self.player == 2 else -1
# 		distance_x = int(paddle_x - ball_x) * direction
# 		distance_y = int(paddle_y - ball_y)
# 		distance_y = -1 if distance_y > 0 else 1 if distance_y < -PADDLE_HEIGHT_DUO else 0
# 		distance_x = 0 if distance_x < self.closest else 1 if distance_x < self.mid else 2 if distance_x < self.farest else 3
# 		ball_speed = int((ball_v_x ** 2 + ball_v_y ** 2) ** 0.5)
# 		ball_speed = 0 if ball_speed <= 2 else 1 if ball_speed < 5 else 2

# 		return (distance_x, distance_y, ball_speed, int(paddle_y / PongBot.REDUCTION))

# 	async def get_state(self):
# 		serialize = await self.game.serialize()
# 		paddle_pos = serialize['players'][f'player{self.player}']['pos']
# 		ball = serialize['ball']
# 		self.raw_pos = paddle_pos['y']
# 		score = serialize['left_score']
# 		self.defeat = True if score != self.losses else False
# 		self.losses = score
# 		state = [[ball['x'], ball['y'], ball['x_vel'], ball['y_vel']], [paddle_pos['x'], paddle_pos['y']]]

# 		return state

# 	async def choose_action(self, state):
# 		if self.training:
# 			self.epsilon = max(PongBot.EPSILON, self.epsilon * 0.99)
# 			if random.uniform(0, 1) < self.epsilon:
# 				return random.choice(PongBot.actions)
# 			if random.uniform(0, 1) < self.epsilon:
# 				predicted_y = await self.predict_ball_position(state)
# 				return -1 if predicted_y < state[-1][-1] else 1 if predicted_y > (state[-1][-1] + PADDLE_HEIGHT_DUO) else 0
# 		state_key = await self.calculate_state(state)
# 		if state_key not in PongBot.q_table:
# 			return 0
# 		return max(PongBot.q_table.get(state_key, {a: 0 for a in PongBot.actions}),
# 			  key=PongBot.q_table.get(state_key, {a: 0 for a in PongBot.actions}).get)

# 	async def continuous_paddle_mov(self, state):
# 		action = await self.choose_action(state)
# 		if action:
# 			player_move = {'player': self.player, 'direction': action}
# 			await self.game.move_player_paddle(player_move)

# 		return action

# 	async def bot_loop(self):
# 		last_time = time.time()
# 		state = new_state = await self.get_state()
# 		refresh_rate = 1 if not self.training else 0
# 		sleep_rate = SLEEP * 4 if not self.training else SLEEP / 8
# 		while True:
# 			try:
# 				action = await self.continuous_paddle_mov(state)
# 				curr_time = time.time()
# 				if curr_time - last_time >= refresh_rate:
# 					new_state = await self.get_state()
# 					last_time = curr_time
# 				else:
# 					self.raw_pos = max(0, min(GAME_HEIGHT, self.raw_pos + action * PADDLE_START_VEL))
# 					new_state = state
# 					new_state[-1][-1] = self.raw_pos
# 				if self.training:
# 					reward = await self.get_reward(state, new_state)
# 					state_key = await self.calculate_state(state)
# 					new_state_key = await self.calculate_state(new_state)
# 					self.history.append([state_key, action, reward, new_state_key])
# 					if last_time == curr_time:
# 						self.history[0][-1] = new_state_key
# 						await self.update_q_table_n_steps()
# 				state = new_state

# 				await asyncio.sleep(sleep_rate)
# 			except Exception as e:
# 				logger.error(f'Error in bot_loop: {str(e)}', exc_info=True)

# 	async def launch_bot(self):
# 		if not PongBot.instances:
# 			PongBot.q_table = await sync_to_async(self.bot_db.load_table)()
# 		PongBot.instances += 1
# 		self.loop_task = asyncio.create_task(self.bot_loop())

# 	async def cancel_loop(self):
# 		if hasattr(self, 'loop_task'):
# 			self.loop_task.cancel()
# 			PongBot.instances -= 1
# 		if not PongBot.instances:
# 			await self.update_table_to_db()
# 			print(f'\ntable => {PongBot.q_table}')

# 	@sync_to_async
# 	def	update_table_to_db(self):
# 		self.bot_db.save_table(PongBot.q_table)


#	###			version 3		### #
# import random
# import asyncio
# import time
# import math
# from asgiref.sync import sync_to_async

# from configFiles.globals import *
# from ..models import *


# import logging
# logging.basicConfig(level=logging.ERROR)
# logger = logging.getLogger(__name__)


# class PongBot():
# 	instances = 0
# 	q_table = {}
# 	REDUCTION = 10
# 	ALPHA = 0.55 #learning rate
# 	GAMMA = 0.7 #discount factor
# 	EPSILON = 0.03 #exploration rate
# 	EPSILON_TRAIN = 0.35 #exploration rate
# 	actions = [-1, 0, 1] #moves [up, nothing, down]


# 	def __init__(self, game, player, bot_db, training=False):
# 		self.training = training
# 		self.bot_db = bot_db
# 		self.game = game
# 		self.player = player
# 		self.history = []
# 		self.raw_pos = None
# 		self.losses = 0
# 		self.defeat = False
# 		self.epsilon = PongBot.EPSILON_TRAIN
# 		self.farest = int((GAME_WIDTH / 4 ) * 3)
# 		self.mid = int(self.farest / 2)
# 		self.closest = int(self.mid / 2)

# # v3
# 	async def update_q_table_n_steps(self):
# 		if not len(self.history):
# 			return
# 		g_reward = 0
# 		for state, action, reward, new_state in reversed(self.history):
# 			g_reward = reward + PongBot.GAMMA * g_reward
# 			if state != new_state:
# 				if state not in PongBot.q_table:
# 					PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

# 				old_value = PongBot.q_table[state][action]
# 				future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
# 				new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (g_reward + PongBot.GAMMA * future_max)
# 				PongBot.q_table[state][action] = new_value
# 		self.history = []


# 	async def predict_ball_position(self, state):
# 		ball_x, ball_y, ball_v_x, ball_v_y = state[0]
# 		paddle_x, paddle_y = state[1]
# 		if not ball_v_x:
# 			return paddle_y
# 		if (self.player == 2 and ball_v_x < 0) or (self.player == 1 and ball_v_x > 0):
# 			return GAME_HEIGHT // 2
# 		pos_x = paddle_x
# 		while (self.player == 2 and ball_x < pos_x) or (self.player == 1 and ball_x > pos_x):
# 			ball_x += ball_v_x
# 			ball_y += ball_v_y
# 			if ball_y <= 0 or ball_y >= GAME_HEIGHT:
# 				ball_v_y *= -1
# 				ball_y = max(0, min(ball_y, GAME_HEIGHT))

# 		return ball_y

# 	async def get_reward(self, state, new_state):
# 		old_ball_x, old_ball_y, old_ball_v_x, old_ball_v_y = state[0]
# 		old_paddle_x, old_paddle_y = state[1]
# 		new_ball_x, new_ball_y, new_ball_v_x, new_ball_v_y = new_state[0]
# 		new_paddle_x, new_paddle_y = new_state[1]

# 		old_predicted_y = await self.predict_ball_position(state)
# 		new_predicted_y = await self.predict_ball_position(new_state)

# 		old_distance_to_predict = abs(old_predicted_y - old_paddle_y)
# 		new_distance_to_predict = abs(new_predicted_y - new_paddle_y)

# 		is_closer = (self.player == 2 and new_ball_x > old_ball_x) or (self.player == 1 and new_ball_x < old_ball_x)

# 		if self.defeat:
# 			self.defeat = False
# 			return -20 # Penalidade alta por perder um ponto

# 		if (self.player == 2 and old_ball_v_x > 0 and new_ball_v_x < 0) or (self.player == 1 and old_ball_v_x < 0 and new_ball_v_x > 0):
# 			return 10  # Recompensa alta por rebater a bola

# 		if new_distance_to_predict <= PADDLE_HEIGHT_DUO and new_predicted_y > new_paddle_y:
# 			return 5  # Recompensa por estar próximo à posição prevista

# 		# Small reward for moving towards the ball when it's approaching
# 		if is_closer and new_distance_to_predict < old_distance_to_predict:
# 			return 1

# 		# Penalty for moving away from the predicted position when the ball is approaching
# 		if is_closer and new_distance_to_predict > old_distance_to_predict:
# 			return -1

# 		return 0

# 	async def calculate_state(self, state):
# 		ball_x, ball_y, ball_v_x, ball_v_y = state[0]
# 		paddle_x, paddle_y = state[1]
# 		direction = 1 if self.player == 2 else -1
# 		distance_x = int(paddle_x - ball_x) * direction
# 		distance_y = int(paddle_y - ball_y)
# 		distance_y = -1 if distance_y > 0 else 1 if distance_y < -PADDLE_HEIGHT_DUO else 0
# 		distance_x = 0 if distance_x < self.closest else 1 if distance_x < self.mid else 2 if distance_x < self.farest else 3
# 		ball_speed = int((ball_v_x ** 2 + ball_v_y ** 2) ** 0.5)
# 		ball_speed = 0 if ball_speed <= 2 else 1 if ball_speed < 5 else 2

# 		return (distance_x, distance_y, ball_speed, int(paddle_y / PongBot.REDUCTION))

# 	async def get_state(self):
# 		serialize = await self.game.serialize()
# 		paddle_pos = serialize['players'][f'player{self.player}']['pos']
# 		ball = serialize['ball']
# 		self.raw_pos = paddle_pos['y']
# 		score = serialize['left_score']
# 		self.defeat = True if score != self.losses else False
# 		self.losses = score
# 		state = [[ball['x'], ball['y'], ball['x_vel'], ball['y_vel']], [paddle_pos['x'], paddle_pos['y']]]

# 		return state

# 	async def choose_action(self, state):
# 		if self.training:
# 			self.epsilon = max(PongBot.EPSILON, self.epsilon * 0.99)
# 			if random.uniform(0, 1) < self.epsilon:
# 				return random.choice(PongBot.actions)
# 			if random.uniform(0, 1) < PongBot.EPSILON:
# 				predicted_y = await self.predict_ball_position(state)
# 				return -1 if predicted_y < state[-1][-1] else 1 if predicted_y > (state[-1][-1] + PADDLE_HEIGHT_DUO) else 0
# 		state_key = await self.calculate_state(state)
# 		if state_key not in PongBot.q_table:
# 			return 0
# 		return max(PongBot.q_table.get(state_key, {a: 0 for a in PongBot.actions}),
# 			  key=PongBot.q_table.get(state_key, {a: 0 for a in PongBot.actions}).get)

# 	async def continuous_paddle_mov(self, state):
# 		action = await self.choose_action(state)
# 		if action:
# 			player_move = {'player': self.player, 'direction': action}
# 			await self.game.move_player_paddle(player_move)

# 		return action

# 	async def bot_loop(self):
# 		last_time = time.time()
# 		state = new_state = await self.get_state()
# 		refresh_rate = 1 if not self.training else 0.12
# 		sleep_rate = SLEEP * 4 if not self.training else SLEEP / 8
# 		while True:
# 			try:
# 				action = await self.continuous_paddle_mov(state)
# 				curr_time = time.time()
# 				if curr_time - last_time >= refresh_rate:
# 					new_state = await self.get_state()
# 					last_time = curr_time
# 				else:
# 					self.raw_pos = max(0, min(GAME_HEIGHT, self.raw_pos + action * PADDLE_START_VEL))
# 					new_state = state
# 					new_state[-1][-1] = self.raw_pos
# 				if self.training:
# 					reward = await self.get_reward(state, new_state)
# 					state_key = await self.calculate_state(state)
# 					new_state_key = await self.calculate_state(new_state)
# 					self.history.append([state_key, action, reward, new_state_key])
# 					if last_time == curr_time:
# 						self.history[0][-1] = new_state_key
# 						await self.update_q_table_n_steps()
# 				state = new_state

# 				await asyncio.sleep(sleep_rate)
# 			except Exception as e:
# 				logger.error(f'Error in bot_loop: {str(e)}', exc_info=True)

# 	async def launch_bot(self):
# 		if not PongBot.instances:
# 			PongBot.q_table = await sync_to_async(self.bot_db.load_table)()
# 		PongBot.instances += 1
# 		self.loop_task = asyncio.create_task(self.bot_loop())

# 	async def cancel_loop(self):
# 		if hasattr(self, 'loop_task'):
# 			self.loop_task.cancel()
# 			PongBot.instances -= 1
# 		if not PongBot.instances:
# 			await self.update_table_to_db()
# 			print(f'\ntable => {PongBot.q_table}')

# 	@sync_to_async
# 	def	update_table_to_db(self):
# 		self.bot_db.save_table(PongBot.q_table)



#	###			version 4		### #
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
	REDUCTION = 10
	ALPHA = 0.55 #learning rate
	GAMMA = 0.7 #discount factor
	EPSILON = 0.03 #exploration rate
	EPSILON_TRAIN = 0.35 #exploration rate
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
		self.epsilon = PongBot.EPSILON_TRAIN
		# self.farest = int((GAME_WIDTH / 4 ) * 3)
		# self.mid = int(self.farest / 2)
		# self.closest = int(self.mid / 2)

# v3
	async def update_q_table_n_steps(self):
		if not len(self.history):
			return
		g_reward = 0
		for state, action, reward, new_state in reversed(self.history):
			g_reward = reward + PongBot.GAMMA * g_reward
			if state != new_state:
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
		if (self.player == 2 and ball_v_x < 0) or (self.player == 1 and ball_v_x > 0):
			return GAME_HEIGHT // 2
		pos_x = paddle_x
		while (self.player == 2 and ball_x < pos_x) or (self.player == 1 and ball_x > pos_x):
			ball_x += ball_v_x
			ball_y += ball_v_y
			if ball_y <= 0 or ball_y >= GAME_HEIGHT:
				ball_v_y *= -1
				ball_y = max(0, min(ball_y, GAME_HEIGHT))

		return ball_y

	async def get_reward(self, state, new_state):
		old_ball_x, old_ball_y, old_ball_v_x, old_ball_v_y = state[0]
		old_paddle_x, old_paddle_y = state[1]
		new_ball_x, new_ball_y, new_ball_v_x, new_ball_v_y = new_state[0]
		new_paddle_x, new_paddle_y = new_state[1]

		old_predicted_y = await self.predict_ball_position(state)
		new_predicted_y = await self.predict_ball_position(new_state)

		old_distance_to_predict = abs(old_predicted_y - old_paddle_y)
		new_distance_to_predict = abs(new_predicted_y - new_paddle_y)

		is_closer = (self.player == 2 and new_ball_x > old_ball_x) or (self.player == 1 and new_ball_x < old_ball_x)

		if self.defeat:
			self.defeat = False
			return -20 # Penalidade alta por perder um ponto

		if (self.player == 2 and old_ball_v_x > 0 and new_ball_v_x < 0) or (self.player == 1 and old_ball_v_x < 0 and new_ball_v_x > 0):
			return 10  # Recompensa alta por rebater a bola

		if new_distance_to_predict <= PADDLE_HEIGHT_DUO and new_predicted_y > new_paddle_y:
			return 5  # Recompensa por estar próximo à posição prevista

		# Small reward for moving towards the ball when it's approaching
		if is_closer and new_distance_to_predict < old_distance_to_predict:
			return 1

		# Penalty for moving away from the predicted position when the ball is approaching
		if is_closer and new_distance_to_predict > old_distance_to_predict:
			return -1

		return 0

	async def calculate_state(self, state):
		ball_x, ball_y, ball_v_x, ball_v_y = state[0]
		paddle_x, paddle_y = state[1]
		direction = 1 if self.player == 2 else -1
		distance_x = int((paddle_x - ball_x) / PongBot.REDUCTION) * direction
		distance_y = int(paddle_y - ball_y)
		distance_y = -1 if distance_y > 0 else 1 if distance_y < -PADDLE_HEIGHT_DUO else 0
		# distance_x = 0 if distance_x < self.closest else 1 if distance_x < self.mid else 2 if distance_x < self.farest else 3
		ball_speed = int((ball_v_x ** 2 + ball_v_y ** 2) ** 0.5)
		ball_speed = 0 if ball_speed <= 2 else 1 if ball_speed < 5 else 2

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
		if self.training:
			self.epsilon = max(PongBot.EPSILON, self.epsilon * 0.99)
			if random.uniform(0, 1) < self.epsilon:
				return random.choice(PongBot.actions)
			if random.uniform(0, 1) < PongBot.EPSILON:
				predicted_y = await self.predict_ball_position(state)
				return -1 if predicted_y < state[-1][-1] else 1 if predicted_y > (state[-1][-1] + PADDLE_HEIGHT_DUO) else 0
		state_key = await self.calculate_state(state)
		if state_key not in PongBot.q_table:
			return 0
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
		state = new_state = await self.get_state()
		refresh_rate = 1 if not self.training else 0.12
		sleep_rate = SLEEP * 4 if not self.training else SLEEP / 8
		while True:
			try:
				action = await self.continuous_paddle_mov(state)
				curr_time = time.time()
				if curr_time - last_time >= refresh_rate:
					new_state = await self.get_state()
					last_time = curr_time
				else:
					self.raw_pos = max(0, min(GAME_HEIGHT, self.raw_pos + action * PADDLE_START_VEL))
					new_state = state
					new_state[-1][-1] = self.raw_pos
				if self.training:
					reward = await self.get_reward(state, new_state)
					state_key = await self.calculate_state(state)
					new_state_key = await self.calculate_state(new_state)
					self.history.append([state_key, action, reward, new_state_key])
					if last_time == curr_time:
						self.history[0][-1] = new_state_key
						await self.update_q_table_n_steps()
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
			print(f'\ntable => {PongBot.q_table}')

	@sync_to_async
	def	update_table_to_db(self):
		self.bot_db.save_table(PongBot.q_table)
