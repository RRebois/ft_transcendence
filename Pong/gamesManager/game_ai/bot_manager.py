import asyncio
import pickle
from asgiref.sync import sync_to_async

from .bot_pong import PongBot
from .bot_purrinha import PurrinhaBot
from ..games.pong import PongGame
from userManagement.models import User
from ..models import BotQTable
from configFiles.globals import *


async def	init_bot(game_name, game, consumer):
	await sync_to_async(User.objects.get_or_create)(username=BOT_NAME)
	if game_name == 'pong':
		try:
			bot_db = await sync_to_async(BotQTable.objects.get)(name=BOT_NAME)
			with open('ai_q_table.pickle', 'wb') as file:
				pickle.dump(bot_db.q_table, file)
			# await sync_to_async(bot_db.save_table)({})
		except:
			bot_db = await sync_to_async(BotQTable.objects.create)(name=BOT_NAME)

		# return TrainPong(0, bot_db, game, consumer)
		# test = []
		# amount = 4
		# for i in range(amount):
		# 		tmp = TrainPong(i, bot_db, game, consumer)
		# 		await tmp.launch_train()
		# 		test.append(tmp)
		# while test:
		# 	for t in test:
		# 		if t.finished:
		# 			test.remove(t)
		# 	await asyncio.sleep(SLEEP)

		"""
		against Trainbot
		"""
		tmp = TrainPong(0, bot_db, game, consumer)
		await tmp.launch_train()
		while not tmp.finished:
			await asyncio.sleep(SLEEP)
		"""
		against himself
		"""
		tmp = TrainPong(1, bot_db, game, consumer)
		await tmp.launch_train()
		while not tmp.finished:
			await asyncio.sleep(SLEEP)

		# test = TrainPong(1, bot_db)
		# await test.launch_train()
		# while not test.finished:
		# 	await asyncio.sleep(SLEEP)

		bot = PongBot(game, 2, bot_db, training=False)
		return bot
	if game_name == 'purrinha':
		return PurrinhaBot(game)

class	TrainPong():
	players_name = {'training_bot1': {'id': 1}, 'training_bot2': {'id': 2}}

	def	__init__(self, i, bot_db, game, consumer):
		self.consumer = consumer
		self.limit = 2
		self.count = self.step = 50
		self.i = i
		self.finished = False
		self.game = PongGame(TrainPong.players_name)
		self.bot1 = TestBot(self.game, 1, bot_db, training=True) if not i else PongBot(self.game, 1, bot_db, training=True)
		self.bot2 = PongBot(self.game, 2, bot_db, training=True)

	async def	game_loop(self):
		print(f'create train {self.i}')
		await self.bot1.launch_bot()
		await self.bot2.launch_bot()
		while True:
			await self.game.update()
			# if not i:
			# await self.consumer.send_game_state()
			await self.try_cancel_loop()
			await asyncio.sleep(SLEEP / 8)

	async def launch_train(self):
		self.loop_task = asyncio.create_task(self.game_loop())

	async def try_cancel_loop(self):
		gs = await self.game.serialize()
		if gs['left_score'] >= self.count or gs['right_score'] >= self.count:
			self.count += self.step
			print(f'\n\nTrain {self.i} => {gs['left_score']} x {gs['right_score']}\nq-table size => {len(PongBot.q_table)}')
		if gs['left_score'] >= self.limit or gs['right_score'] >= self.limit or len(PongBot.q_table) > 18500:
			await self.cancel_loop()

	async def cancel_loop(self):
		await self.bot1.cancel_loop()
		await self.bot2.cancel_loop()
		self.loop_task.cancel()
		self.finished = True
		print(f'finished train {self.i}')

class TestBot():

	def __init__(self, game, player, bot_db, training=False):
		self.training = training
		self.bot_db = bot_db
		self.game = game
		self.player = player

	async def continuous_paddle_mov(self, action):
		player_move = {'player': self.player, 'direction': action}
		await self.game.move_player_paddle(player_move)


	async def bot_loop(self):
		while True:
			serialize = await self.game.serialize()
			paddle_pos = serialize['players'][f'player{self.player}']['pos']['y']
			ball = serialize['ball']['y']
			action = 1 if ball > paddle_pos + PADDLE_HEIGHT_DUO / 2 else -1
			await self.continuous_paddle_mov(action)
			await asyncio.sleep(SLEEP / 8)

	async def launch_bot(self):
		self.loop_task = asyncio.create_task(self.bot_loop())

	async def cancel_loop(self):
		if hasattr(self, 'loop_task'):
			self.loop_task.cancel()


"""
	verifier le temps de vie des cookies par rapport au login
"""
