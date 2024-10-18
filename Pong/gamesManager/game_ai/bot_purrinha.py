from random import choice, randint
import asyncio

from configFiles.globals import *

class PurrinhaBot():

	def __init__(self, game):
		self.game = game
		self.nb_pick = None
		self.nb_guess = None

	async def game_loop(self):
		while True:
			await asyncio.sleep(0.35)
			gs = self.game.message['game_state']
			if self.nb_pick is None:
				# choose
				self.nb_pick = randint(0, MAX_QUANTITY)
				self.game.receive({'action': 'pick_initial_number', 'selected_value': self.nb_pick, 'player_id': 2})
			if gs['round'] == 'guessing':
				# guess
				if gs['player_turn'] == 2:
					self.nb_guess = choice([nb for nb in gs['available_to_guess'] if nb > self.nb_pick])
					self.game.receive({'action': 'sum_guessed', 'selected_value': self.nb_guess, 'player_id': 2})
			if gs['round'] == 'finished':
				await self.reset_nbs()

	async def reset_nbs(self):
		self.nb_guess = None
		self.nb_pick = None

	async def launch_bot(self):
		if not hasattr(self, 'loop_task'):
			self.loop_task = asyncio.create_task(self.bot_loop())
		else:
			await self.reset_nbs()

	async def cancel_loop(self):
		if hasattr(self, 'loop_task'):
			self.loop_task.cancel()