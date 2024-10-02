import json

import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from django.core.cache import cache
from random import choice
from .games.pong import PongGame
from .games.purrinha import PurrinhaGame
from matchs.views import create_match, add_match_to_tournament, send_to_tournament_group
from .views import MatchMaking
from .game_ai.bot_manager import init_bot
from configFiles.globals import *


class	GameManagerConsumer(AsyncWebsocketConsumer):
	matchs = {}

	async def	connect(self):
		self.game_name = self.scope['url_route']['kwargs']['game_name']
		self.game_code = int(self.scope['url_route']['kwargs']['game_code'])
		self.session_id = self.scope['url_route']['kwargs']['session_id']
		self.game_handler = None
		self.user = self.scope['user']
		self.username = self.user.username

		await self.accept()
		self.session_data = await self.get_session_data()
		self.players_max = self.session_data['awaited_players']

		error_msg = ''
		print(f"\n\n\nusername => {self.username}\nsession_data => {self.session_data}")
		if self.game_name not in ['pong', 'purrinha']:
			error_msg = 'this game does not exist'
		elif self.game_code not in [10, 20, 22, 23, 40]:
			error_msg = 'this game code does not exist'
		# elif self.session_data is None:
		# 	error_msg = 'this session does not exist'
		elif self.username == '':
			error_msg = 'error getting the user data, maybe you are not connected anymore'
		elif self.username not in self.session_data['players']:
			error_msg = 'you are not allowed to join this session'
		if error_msg:
			await self.send(text_data=json.dumps({"error_message": error_msg}))
			await self.close()
			return

		await self.change_connection_status()
		await self.channel_layer.group_add(
			self.session_id,
			self.channel_name
		)

		if self.session_data['status'] == 'ready':
			self.game_handler = PongHandler(self) if self.game_name == 'pong' else PurrinhaHandler(self)
			GameManagerConsumer.matchs[self.session_id] = self.game_handler
			await self.game_handler.launch_game(self.session_data['players'])
			if self.game_name == 'purrinha':
				self.session_data['status'] = 'started'
				await self.game_handler.reset_game()
				await self.update_cache_db(self.session_data)
		else:
			self.loop_task = asyncio.create_task(self.fetch_session_data_loop())
		print(f'\n\n\nusername => |{self.username}|\nuser => |{self.user}|\ncode => |{self.game_code}|\n data => |{self.session_data}|\nscope => |{self.scope}| \n\n')
		await self.send_to_group(self.session_data)

	async def	receive(self, text_data):
		data = json.loads(text_data)
		msg = data.get('game_status')
		if self.game_name == 'pong' and msg:
			self.session_data['status'] = 'started'
			await self.update_cache_db(self.session_data)
			if self.game_handler is not None:
				await self.game_handler.reset_game()
		if self.game_handler is not None:
			if self.game_name == 'pong' and self.game_code != 20 and self.game_code != 40:
				player_move = data.get('player_move')
				if player_move:
					player_move['player'] = self.session_data['players'][self.username]['id']
					data['player_move'] = player_move
			await self.game_handler.receive(data)

	async def	send_to_group(self, message):
		await self.channel_layer.group_send(self.session_id, {"type": "session.msg", "message": message})

	async def	session_msg(self, event):
		message = event["message"]
		await self.send(text_data=json.dumps(message))

	async def	disconnect(self, close_code):
		await self.decrement_connection_count()
		await self.channel_layer.group_discard(
			self.session_id,
			self.channel_name
		)

	async def	fetch_session_data_loop(self):
		while True:
			await self.fetch_session_data()
			await asyncio.sleep(0.4)

	async def	fetch_session_data(self):
		if self.session_data['status'] != 'started':
			self.session_data = await self.get_session_data()
		else:
			self.game_handler = GameManagerConsumer.matchs.get(self.session_id)
			await self.game_handler.add_consumer(self)
			await self.loop_task.cancel()


	@database_sync_to_async
	def update_cache_db(self, session_data):
		cache.set(self.session_id, session_data)

	@database_sync_to_async
	def get_session_data(self):
		session_data = cache.get(self.session_id)
		if session_data:
			return session_data
		error_msg = 'this session does not exist'
		self.send(text_data=json.dumps({"error_message": error_msg}))
		self.close()

	@database_sync_to_async
	def change_connection_status(self):
		self.session_data['connected_players'] += 1
		player = self.session_data['players'].get(self.username)
		if player:
			self.session_data['players'][self.username]['connected'] = True
		else:
			self.session_data['players'] = {self.username: {'connected': True, 'id': self.session_data['connected_players']}}
		if self.session_data['connected_players'] == self.session_data['awaited_players']:
			self.session_data['status'] = 'ready'
		cache.set(self.session_id, self.session_data)


	async def decrement_connection_count(self):
		session_data = await self.get_session_data()
		session_data['connected_players'] -= 1
		session_data['players'][self.username]['connected'] = False
		if session_data['status'] == 'started':
			other_player = []
			winner_group = [1, 2] if session_data['players'][self.username]['id'] > 2 else [3, 4]
			for player in session_data['players']:
				if self.game_code == 40:
					if session_data['players'][player]['id'] in winner_group:
						other_player.append(player)
				else:
					if session_data['players'][player]['connected']:
						other_player.append(player)
			await self.game_handler.end_game(winner=other_player)
			await self.game_handler.remove_consumer(self)

		if session_data['connected_players'] <= 0:
			await database_sync_to_async(cache.delete)(self.session_id)
			await sync_to_async(MatchMaking.delete_session)(self.session_id)
			GameManagerConsumer.matchs.pop(self.session_id)
		else:
			await database_sync_to_async(cache.set)(self.session_id, session_data)

class PongHandler():

	def	__init__(self, consumer):
		self.consumer = [consumer]
		self.game_code = consumer.game_code
		self.bot = None

	async def	launch_game(self, players_name):
		self.message = self.consumer[0].session_data
		self.game = PongGame(players_name, multiplayer=(self.game_code == 40))
		await self.send_game_state()
		if BOT_NAME in self.message['players']:
			self.bot = await init_bot('pong', self.game)
		if self.bot:
			print('\n\n\nYEAH\n\n\n')
			

	@database_sync_to_async
	def	tournament_database_update(self):
		cache_db = cache.get(self.message['tournament_id'])
		gs = self.message['game_state']
		player1 = gs['players']['player1']['name']
		player2 = gs['players']['player2']['name']
		status = 'finished' if gs['left_score'] >= gs['winning_score']\
			or gs['right_score'] >= gs['winning_score'] else 'running'
		for match in cache_db['matchs']:
			if match.get(player1) and match.get(player2):
				match[player1] = gs['left_score']
				match[player2] = gs['right_score']
				match['status'] = status
				cache.set(self.message['tournament_id'], cache_db)
				break

	async def	tournament_update(self):
		if self.game_code == 23 and self.message['game_state']['new_round']:
			await self.tournament_database_update()
			await sync_to_async(send_to_tournament_group)(self.message['tournament_id'])

	async def	add_consumer(self, consumer):
		self.consumer.append(consumer)

	async def	remove_consumer(self, consumer=None):
		if consumer:
			self.consumer.remove(consumer)
		for client in self.consumer:
			client.close()

	async def	reset_game(self):
		if not hasattr(self, 'loop_task'):
			self.game.reset_game()
			self.loop_task = asyncio.create_task(self.game_loop())


	async def	receive(self, text_data):
		player_move = text_data.get('player_move')
		if player_move:
			await self.game.move_player_paddle(player_move)

	async def	game_loop(self):
		if self.bot:
			await self.bot.launch_bot()
		while True:
			await self.update_game_state()
			await asyncio.sleep(SLEEP)

	async def	update_game_state(self):
		await self.game.update()
		await self.send_game_state()
		await self.tournament_update()
		await self.end_game()

	async def	send_game_state(self):
		game_state = await self.game.serialize()
		self.message['game_state'] = game_state
		await self.consumer[0].send_to_group(self.message)

	async def	cancel_loop(self):
		if self.bot:
			await self.bot.cancel_loop()
			# await self.bot.update_q_table_db()
		if hasattr(self, 'loop_task'):
			await self.loop_task.cancel()

	async def	end_game(self, winner=None):

		gs = self.message['game_state']
		if winner is None and gs['left_score'] != gs['winning_score'] and gs['right_score'] != gs['winning_score']:
			return
		middle = 1 if self.game_code != 40 else 2
		if not winner:
			winner = []
			left = (gs['right_score'] < gs['left_score'])
			my_range = [0, middle] if left else [middle, middle * 2]
			for i in range(my_range[0], my_range[1]):
				key = f'player{i + 1}'
				winner.append(gs['players'][key]['name'])
		if self.game_code != 20: # mode vs 'guest', does not save scores
			match_result = {}
			for i in range(0, middle * 2):
				key = f"player{i + 1}"
				match_result[gs['players'][key]['name']] = gs['left_score'] if i < middle else gs['right_score']
			# print(f'\n\n\n match result => {match_result}\n\n')
			match = await sync_to_async(create_match)(match_result, winner)
		self.message['winner'] = winner
		self.message['status'] = 'finished'
		await self.consumer[0].update_cache_db(self.message)
		await self.consumer[0].send_to_group(self.message)
		if self.message['tournament_id']:
			await sync_to_async(add_match_to_tournament)(self.message['tournament_id'], match)
		await self.cancel_loop()
			# pass
		# await self.remove_consumer()

		# send notification + restart the game



class PurrinhaHandler():

	def	__init__(self, consumer):
		self.consumer = [consumer]
		self.game_code = consumer.game_code

	async def	launch_game(self, players_name):
		self.message = self.consumer[0].session_data
		self.player_nb = len(players_name)
		self.turns_id = [i + 1 for i in range(0, self.player_nb)]
		self.wins = {player: 0 for player in players_name.keys()}
		self.game = PurrinhaGame(players_name)
		if BOT_NAME in self.message['players']:
			# init_bot()
			pass

	async def	add_consumer(self, consumer):
		self.consumer.append(consumer)

	async def	remove_consumer(self, consumer=None):
		if consumer:
			self.consumer.remove(consumer)
		for client in self.consumer:
			client.close()

	async def	get_new_turn(self):
		if self.turns_id:
			self.curr_turn = choice(self.turns_id)
			self.turns_id.remove(self.curr_turn)

	async def	reset_game(self):
		if len(self.turns_id) == self.player_nb:
			await self.get_new_turn()
			self.message['game_state'] = await self.game.get_status()
			self.message['game_state']['player_turn'] = self.curr_turn
			self.message['game_state']['history'] = self.wins
			await self.consumer[0].send_to_group(self.message)

	async def	parse_quantity(self, quantity, id):
		if not quantity:
			return False
		if self.message['game_state']['players'][f'player{id}']['quantity']:
			name = self.message['game_state']['players'][f'player{id}']['name']
			self.message['game_state']['error_message'] = 'you have already chosen a number'
			for consumer in self.consumer:
				if consumer.username == name:
					await consumer.send(text_data=json.dumps(self.message))
			return False
		return True

	async def	parse_guess(self, guess, id):
		if not guess:
			return False
		message = ''
		nb_to_guess = await self.game.get_number_to_guess()
		if not self.message['game_state']['players'][f'player{id}']['quantity']:
			message = 'you need to choose a number before your guess'
		if self.curr_turn != id:
			message = 'you have to wait your turn to guess'
		if guess not in nb_to_guess:
			message = 'you cannot try to guess this number'
		if message:
			self.message['game_state']['error_message'] = message
			name = self.message['game_state']['players'][f'player{id}']['name']
			for consumer in self.consumer:
				if consumer.username == name:
					await consumer.send(text_data=json.dumps(self.message))
			return False
		return True

	async def	receive(self, text_data):
		action = text_data.get('action')
		value = text_data.get('selected_value')
		player_id = text_data.get('player_id')
		ret = None
		if action == "pick_initial_number":
			ret = await self.parse_quantity(value, player_id)
			if ret:
				await self.game.set_player_quantity(player_id, value)
		if action == "sum_guessed":
			ret = await self.parse_guess(value, player_id)
			if ret:
				await self.game.set_player_guess(player_id, value)
		if ret:
			await self.get_new_turn()
			self.message['game_state'] = await self.game.get_status()
			self.message['game_state']['player_turn'] = self.curr_turn
			self.message['game_state']['history'] = self.wins
			if self.message['game_state']['round'] == 'finished':
				await self.end_game()
			else:
				await self.consumer[0].send_to_group(self.message)


	async def	end_game(self, winner=None):
		if not winner:
			winner = [self.message['game_state']['winner']]
		else:
			winner = winner[0]
		if winner != 'tie':
			self.wins[winner] += 1
			self.message['game_state']['history'] = self.wins
			if self.wins[winner] == MAX_ROUND_WINS:
				self.message['winner'] = winner
				self.message['status'] = 'finished'
				await self.consumer[0].update_cache_db(self.message)
				await sync_to_async(create_match)(self.wins, [winner])
		await self.consumer[0].send_to_group(self.message)
		if not self.message['winner']:
			self.game.play_again()
			self.turns_id = [i + 1 for i in range(0, self.player_nb)]
			self.reset_game()
		# await self.remove_consumer()

		# send notification + restart the game