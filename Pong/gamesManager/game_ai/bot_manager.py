import asyncio

from .bot_pong import PongBot
from ..games.pong import PongGame
from userManagement.models import User
from configFiles.globals import *


def	init_bot(game_name, game):
	bot = User.objects.get_or_create(username=BOT_NAME)
	if game_name == 'pong':
		if not PongBot.is_trained():
			for i in range(100):
				TrainPong(i)
			
		return PongBot(game, 2)
	if game_name == 'purrinha':
		pass

class	TrainPong():
	players_name = {'player1': {'id': 1}, 'player2': {'id': 2}}

	def	__init__(self, i):
		self.game = PongGame(TrainPong.players_name)
		self.bot1 = PongBot(self.game, 1)
		self.bot2 = PongBot(self.game, 2)
		self.launch_train(i)

	async def	game_loop(self, i):
		print(f'create train {i}')
		await self.bot1.launch_bot()
		await self.bot2.launch_bot()
		while True:
			await self.game.update()
			await self.try_cancel_loop(i)
			await asyncio.sleep(SLEEP)

	async def launch_train(self, i):
		self.loop_task = asyncio.create_task(self.game_loop(i))

	async def try_cancel_loop(self, i):
		gs = self.game.serialize()
		if gs['left_score'] >= gs['winning_score'] or gs['right_score'] >= gs['winning_score']:
			self.loop_task.cancel()
			await asyncio.sleep(1)
			await self.bot1.cancel_loop()
			await self.bot2.cancel_loop()
			print(f'finished train {i}')
