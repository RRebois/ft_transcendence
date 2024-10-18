from random import choice, randint
import asyncio

from configFiles.globals import *

class PurrinhaBot():

	def __init__(self, game):
		self.game = game
		self.nb_pick = None
		self.nb_guess = None

	async def bot_loop(self):
		print(f'\n\nbot loop\n\n')
		while True:
			await asyncio.sleep(0.35)
			gs = self.game.message['game_state']
			if self.nb_pick is None:
				# choose
				self.nb_pick = randint(0, MAX_QUANTITY)
				# self.nb_pick = 0
				print(f'\n\nBot pick: {self.nb_pick}\n\n')
				await self.game.receive({'action': 'pick_initial_number', 'selected_value': self.nb_pick, 'player_id': 2})
			elif gs['round'] == 'guessing':
				# guess
				if gs['player_turn'] == 2 and self.nb_guess is None:
					self.nb_guess = choice([nb for nb in gs['available_to_guess'] if nb > self.nb_pick])
					await self.game.receive({'action': 'sum_guessed', 'selected_value': self.nb_guess, 'player_id': 2})
			elif gs['round'] == 'finished':
				await self.reset_nbs()

	async def reset_nbs(self):
		self.nb_guess = None
		self.nb_pick = None

	async def launch_bot(self):
		print(f'\n\nlaunch bot\n\n')
		if not hasattr(self, 'loop_task'):
			self.loop_task = asyncio.create_task(self.bot_loop())
		else:
			await self.reset_nbs()

	async def cancel_loop(self):
		if hasattr(self, 'loop_task'):
			self.loop_task.cancel()