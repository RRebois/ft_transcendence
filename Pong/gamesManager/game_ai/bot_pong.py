import random
import asyncio
import time

from configFiles.globals import *

class PongBot():
	q_table = {} #maybe duplicate to have one for each side
	ALPHA = 0.1 #learning rate
	GAMMA = 0.95 #discount factor
	EPSILON = 0.1 #exploration rate
	actions = [-1, 0, 1] #moves [up, nothing, down]

	def __init__(self, game, player=2, training=False):
		self.training = training
		self.game = game
		self.player = player
		self.winning_score = self.bot_score = self.left_score = self.right_score = 0

	@staticmethod
	def is_trained():
		return len(PongBot.q_table)

	async def get_state(self):
		serialize = await self.game.serialize()
		paddle_pos = serialize[f'player{self.player}']['pos']
		ball = serialize['ball']
		self.winning_score = serialize['winning_score']
		self.bot_score = 0
		if serialize['left_score'] != self.left_score:
			self.bot_score = -10
			self.left_score = serialize['left_score']
		if serialize['right_score'] != self.right_score:
			self.bot_score = 10
			self.right_score = serialize['right_score']
		if self.player == 1:
			self.bot_score *= -1
		# left_score = serialize['left_score']
		# right_score = serialize['right_score']

		# 'players': self.players,
        #         'ball': ball,
        #         'left_score': self.left_score,
        #         'right_score': self.right_score,
        #         'game_width': GAME_WIDTH,					IS IMPORTANT ???
        #         'game_height': GAME_HEIGHT,				IS IMPORTANT ???
        #         'paddle_width': PADDLE_WIDTH,
        #         'paddle_height': self.ph,
        #         : WINNING_SCORE,
        #         'new_round': self.new_round,

		return {'ball': ball, 'paddle': paddle_pos}

	def choose_action(self, state):
		if self.training and random.uniform(0, 1) < PongBot.EPSILON:
			return random.choice(PongBot.actions)
		else:
			return max(PongBot.q_table.get(state, {a: 0 for a in PongBot.actions}),
			  key=PongBot.q_table.get(state, {a: 0 for a in PongBot.actions}.get))
		
	async def update_q_table(self, state, action, reward, new_state):
		if state not in PongBot.q_table:
			PongBot.q_table[state] = {a: 0 for a in PongBot.actions}

		old_value = PongBot.q_table[state][action]
		future_max = max(PongBot.q_table.get(new_state, {a: 0 for a in PongBot.actions}).values())
		new_value = (1 - PongBot.ALPHA) * old_value + PongBot.ALPHA * (reward + PongBot.GAMMA * future_max)
		PongBot.q_table[state][action] = new_value

	async def continuous_paddle_mov(self, state):
		action = self.choose_action(state)

		if action:
			player_move = {'player': self.player, 'direction': action}
			await self.game.move_player_paddle(player_move)
		
		return action
	
	async def bot_loop(self):
		last_time = time.time()
		state = await self.get_state()
		action = 0
		
		while True:
			curr_time = time.time()
			if curr_time - last_time >= 1:
				new_state = await self.get_state()
				last_time = curr_time
				reward = 1 if new_state['ball']['x'] > 0 or new_state['ball']['x'] < GAME_WIDTH else -1
				reward = self.bot_score if self.bot_score else reward
				await self.update_q_table(state, action, reward, new_state)
			action = await self.continuous_paddle_mov(state)
			await asyncio.sleep(SLEEP)

	async def launch_bot(self):
		self.loop_task = asyncio.create_task(self.bot_loop())

	async def cancel_loop(self):
		if hasattr(self, 'loop_task'):
			self.loop_task.cancel()