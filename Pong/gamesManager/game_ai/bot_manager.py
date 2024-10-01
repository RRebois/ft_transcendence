import asyncio
from asgiref.sync import sync_to_async

from .bot_pong import PongBot
from ..games.pong import PongGame
from userManagement.models import User
from configFiles.globals import *


async def	init_bot(game_name, game):
	await sync_to_async(User.objects.get_or_create)(username=BOT_NAME)
	if game_name == 'pong':
		# print('passei aqui => ', PongBot.q_table)
		test = []
		# if not PongBot.is_trained():
		# 	for i in range(100):
		# 		TrainPong(i)
		amount = 2
		for i in range(amount):
				tmp = TrainPong(i)
				await tmp.launch_train()
				test.append(tmp)
		while test:
			for t in test:
				if t.finished:
					test.remove(t)
			await asyncio.sleep(SLEEP)
		print(PongBot.q_table)
		return PongBot(game, 2)
	if game_name == 'purrinha':
		pass

class	TrainPong():
	players_name = {'training_bot1': {'id': 1}, 'training_bot2': {'id': 2}}

	def	__init__(self, i):
		self.i = i
		self.finished = False
		self.game = PongGame(TrainPong.players_name)
		self.bot1 = PongBot(self.game, 1, training=True)
		self.bot2 = PongBot(self.game, 2, training=True)
		# self.launch_train(i)

	async def	game_loop(self):
		print(f'create train {self.i}')
		await self.bot1.launch_bot()
		await self.bot2.launch_bot()
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
			self.loop_task.cancel()
			# await asyncio.sleep(1)
			await self.bot1.cancel_loop()
			await self.bot2.cancel_loop()
			self.finished = True
			print(f'finished train {self.i}')
