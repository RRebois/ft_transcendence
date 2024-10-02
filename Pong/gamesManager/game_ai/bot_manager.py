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

		test = []
		amount = 100
		for i in range(amount):
				tmp = TrainPong(i, bot_db)
				await tmp.launch_train()
				test.append(tmp)
		while test:
			for t in test:
				if t.finished:
					test.remove(t)
			await asyncio.sleep(SLEEP)

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

	async def	game_loop(self):
		print(f'create train {self.i}')
		await self.bot1.launch_bot()
		await self.bot2.launch_bot()
		sleep_rate = SLEEP / 4
		while True:
			await self.game.update()
			await self.try_cancel_loop()
			await asyncio.sleep(sleep_rate)

	async def launch_train(self):
		self.loop_task = asyncio.create_task(self.game_loop())

	async def try_cancel_loop(self):
		gs = await self.game.serialize()
		if gs['left_score'] >= gs['winning_score'] or gs['right_score'] >= gs['winning_score']:
			# await asyncio.sleep(1)
			await self.bot1.cancel_loop()
			await self.bot2.cancel_loop()
			self.loop_task.cancel()
			self.finished = True
			print(f'finished train {self.i}')
