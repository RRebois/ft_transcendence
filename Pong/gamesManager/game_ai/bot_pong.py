import random
import asyncio
import time
from asgiref.sync import sync_to_async

from configFiles.globals import *
from ..models import *

class PongBot():
	instances = 0
	q_table = {}
	ALPHA = 0.1 #learning rate
	GAMMA = 0.95 #discount factor
	EPSILON = 0.1 #exploration rate
	actions = [-1, 0, 1] #moves [up, nothing, down]

	def __init__(self, game, player, bot_db, training=False):
		self.training = training
		self.bot_db = bot_db
		self.game = game
		self.player = player
		self.winning_score = self.bot_score = 0

	# @staticmethod
	# def is_trained():
	# 	return len(q_table)

# TODO to optimize the training rate
	async def get_reward(self, ball, paddle):
		if ball['y'] >= paddle['y'] and ball['y'] <= paddle['y'] + PADDLE_HEIGHT_DUO and ball['x_vel'] > 0:
			return 10
		if ball['x_vel'] > 0:
			return 1
		if paddle['x'] - ball['x'] < 40 and (ball['y'] < paddle['y'] or ball['y'] > paddle['y'] + PADDLE_HEIGHT_DUO):
			return -10
		

	async def get_state(self):
		serialize = await self.game.serialize()
		paddle_pos = serialize['players'][f'player{self.player}']['pos']
		ball = serialize['ball']
		# if ball['y'] >= paddle_pos['y'] and ball['y'] <= paddle_pos['y'] + PADDLE_HEIGHT_DUO:
		# 	# bola na altura do paddle
		# 	self.bot_score = 100 - abs(ball['y'] - paddle_pos['y'])
		# 	pass
		# else:
		# 	# bola fora do paddle
		# 	if ball['y'] < paddle_pos['y']:
		# 		self.bot_score = ball['y'] - paddle_pos['y']
		# 	else:
		# 		self.bot_score = (paddle_pos['y'] + PADDLE_HEIGHT_DUO) - ball['y']
		# self.winning_score = serialize['winning_score']
		self.bot_score = await self.get_reward(ball, paddle_pos)
		# if serialize['left_score'] != self.left_score:
		# 	self.bot_score = -300
		# 	# if self.player == 1:
		# 	# 	self.bot_score *= -1
		# if serialize['right_score'] != self.right_score:
		# 	if self.player == 1:
		# 		self.bot_score = -300
		# 		# self.bot_score *= -1
		# self.left_score = serialize['left_score']
		# self.right_score = serialize['right_score']

		# return (round(ball['x']), round(ball['y']), round(ball['x_vel']), round(ball['y_vel']), round(paddle_pos['x']), round(paddle_pos['y']))
		return (ball['x'] // 10, ball['y'] // 10, (1 if ball['x_vel'] > 0 else -1), (1 if ball['y_vel'] > 0 else -1), round(paddle_pos['x']), round(paddle_pos['y']))

	async def choose_action(self, state):
		if self.training and random.uniform(0, 1) < PongBot.EPSILON + 0.4:
			return random.choice(PongBot.actions)
		
		if random.uniform(0, 1) < PongBot.EPSILON:
			return random.choice(PongBot.actions)
		else:
			return max(PongBot.q_table.get(state, {a: 0 for a in PongBot.actions}),
			  key=PongBot.q_table.get(state, {a: 0 for a in PongBot.actions}).get)

	async def update_q_table(self, state, action, reward, new_state):
		if state not in PongBot.q_table:
			PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

		old_value = PongBot.q_table[state][action]
		future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
		new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (reward + PongBot.GAMMA * future_max)
		PongBot.q_table[state][action] = new_value

	async def continuous_paddle_mov(self, state):
		action = await self.choose_action(state)
		if action:
			player_move = {'player': self.player, 'direction': action}
			await self.game.move_player_paddle(player_move)

		return action

	async def bot_loop(self):
		last_time = time.time()
		state = await self.get_state()
		action = await self.continuous_paddle_mov(state)
		refresh_rate = 1 #if not self.training else 0.25
		sleep_rate = SLEEP * 2 #if not self.training else SLEEP / 2
		while True:
			curr_time = time.time()
			if curr_time - last_time >= refresh_rate:
				reward = self.bot_score
				new_state = await self.get_state()
				last_time = curr_time
				await self.update_q_table(state, action, reward, new_state)
				state = new_state
			action = await self.continuous_paddle_mov(state)
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
