import asyncio
from asgiref.sync import sync_to_async

from .bot_pong import PongBot
from ..games.pong import PongGame
from userManagement.models import User
from ..models import BotQTable
from configFiles.globals import *


async def	init_bot(game_name, game):
	await sync_to_async(User.objects.get_or_create)(username=BOT_NAME)
	if game_name == 'pong':
		try:
			bot_db = await sync_to_async(BotQTable.objects.get)(name=BOT_NAME)
		except:
			bot_db = await sync_to_async(BotQTable.objects.create)(name=BOT_NAME)
		# print('passei aqui => ', PongBot.q_table)
		# if not PongBot.is_trained():
		# 	for i in range(100):
		# 		TrainPong(i)

		# PongBot.q_table = await sync_to_async(bot_db.load_table)()
		# test = []
		# amount = 1000
		# for i in range(amount):
		# 		tmp = TrainPong(i, bot_db)
		# 		await tmp.launch_train()
		# 		test.append(tmp)
		# while test:
		# 	for t in test:
		# 		if t.finished:
		# 			if len(test) == 1:
		# 				await t.update_q_table_db()
		# 			test.remove(t)
		# 	await asyncio.sleep(SLEEP)


		# print(PongBot.q_table)
		bot = PongBot(game, 2, bot_db, training=False)
		return bot
	if game_name == 'purrinha':
		pass

class	TrainPong():
	players_name = {'training_bot1': {'id': 1}, 'training_bot2': {'id': 2}}

	def	__init__(self, i, bot_db):
		self.i = i
		self.finished = False
		self.game = PongGame(TrainPong.players_name)
		self.bot1 = PongBot(self.game, 1, bot_db, training=True)
		self.bot2 = PongBot(self.game, 2, bot_db, training=True)
		# self.launch_train(i)

	async def	game_loop(self):
		print(f'create train {self.i}')
		await self.bot1.launch_bot()
		await self.bot2.launch_bot()
		print(f'created bots {self.i}')
		while True:
			await self.game.update()
			await self.try_cancel_loop()
			await asyncio.sleep(SLEEP)

	async def launch_train(self):
		self.loop_task = asyncio.create_task(self.game_loop())

	async def try_cancel_loop(self):
		gs = await self.game.serialize()
		# print(f"\n\ntest {self.i} dentro de try_cancel {gs['winning_score']} => {gs['left_score']} x {gs['right_score']}")
		if gs['left_score'] >= gs['winning_score'] or gs['right_score'] >= gs['winning_score']:
			# await asyncio.sleep(1)
			print('hahahahaha1')
			await self.bot1.cancel_loop()
			await self.bot2.cancel_loop()
			self.loop_task.cancel()
			print('hahahahaha2')
			self.finished = True
			print(f'finished train {self.i}')

	async def	update_q_table_db(self):
		self.bot1.update_q_table_db()

# django_app  | AttributeError: 'tuple' object has no attribute 'load_table'
# django_app  | 2024-10-01 16:02:15,385 - asyncio - ERROR - Task exception was never retrieved
# django_app  | future: <Task finished name='Task-161' coro=<TrainPong.game_loop() done, defined at /home/Pong/web/gamesManager/game_ai/bot_manager.py:51> exception=AttributeError("'tuple' object has no attribute 'load_table'")>
# django_app  | Traceback (most recent call last):
# django_app  |   File "/home/Pong/web/gamesManager/game_ai/bot_manager.py", line 53, in game_loop
# django_app  |     await self.bot1.launch_bot()
# django_app  |   File "/home/Pong/web/gamesManager/game_ai/bot_pong.py", line 112, in launch_bot
# django_app  |     self.q_table = await sync_to_async(self.bot_db.load_table)()
# django_app  |                                        ^^^^^^^^^^^^^^^^^^^^^^
# django_app  | AttributeError: 'tuple' object has no attribute 'load_table'
# django_app  | 2024-10-01 16:02:15,386 - asyncio - ERROR - Task exception was never retrieved
# django_app  | future: <Task finished name='Task-160' coro=<TrainPong.game_loop() done, defined at /home/Pong/web/gamesManager/game_ai/bot_manager.py:51> exception=AttributeError("'tuple' object has no attribute 'load_table'")>
# django_app  | Traceback (most recent call last):
# django_app  |   File "/home/Pong/web/gamesManager/game_ai/bot_manager.py", line 53, in game_loop
# django_app  |     await self.bot1.launch_bot()
# django_app  |   File "/home/Pong/web/gamesManager/game_ai/bot_pong.py", line 112, in launch_bot
# django_app  |     self.q_table = await sync_to_async(self.bot_db.load_table)()
# django_app  |                                        ^^^^^^^^^^^^^^^^^^^^^^
# django_app  | AttributeError: 'tuple' object has no attribute 'load_table'
# django_app  | 2024-10-01 16:02:15,387 - asyncio - ERROR - Task exception was never retrieved
# django_app  | future: <Task finished name='Task-159' coro=<TrainPong.game_loop() done, defined at /home/Pong/web/gamesManager/game_ai/bot_manager.py:51> exception=AttributeError("'tuple' object has no attribute 'load_table'")>
# django_app  | Traceback (most recent call last):
# django_app  |   File "/home/Pong/web/gamesManager/game_ai/bot_manager.py", line 53, in game_loop
# django_app  |     await self.bot1.launch_bot()
# django_app  |   File "/home/Pong/web/gamesManager/game_ai/bot_pong.py", line 112, in launch_bot
# django_app  |     self.q_table = await sync_to_async(self.bot_db.load_table)()