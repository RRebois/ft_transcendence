import json

import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
# from channels.auth import channel_session_user_from_http
from django.core.cache import cache
from .games.pong import PongGame
from matchs.views import create_match


class	GameManagerConsumer(AsyncWebsocketConsumer):

	# @channel_session_user_from_http
	async def	connect(self):
		# http_user = True
		self.game_name = self.scope['url_route']['kwargs']['game_name']
		self.game_code = int(self.scope['url_route']['kwargs']['game_code'])
		self.session_id = self.scope['url_route']['kwargs']['session_id']
		self.session_data = await self.get_session_data(self.session_id)
		self.players_max = self.session_data['awaited_players']
		self.game_handler = PongHandler(self) #if self.game_name == 'pong' else self.purrinha_handler
		self.user = self.scope['user']
		self.username = self.user.username

		await self.accept()
		if self.game_name not in ['pong', 'purrinha']:
			await self.close()	#TODO change to send the error msg
			pass
		if self.game_code not in [10, 20, 22, 23, 40]:
			await self.close()	#TODO change to send the error msg
			pass
		if self.session_data is None:
			await self.close()	#TODO change to send the error msg
			pass
		if self.username == '':
			await self.close()	#TODO change to send the error msg
			pass
		if self.username not in self.session_data['players']:
			await self.close()	#TODO change to send the error msg
			pass
		await self.change_connection_status()
		await self.channel_layer.group_add(
			self.session_id,
			self.channel_name
		)

		# await self.update_session_data()
		print(f'\n\n\nusername => |{self.username}|\nuser => |{self.user}|\ncode => |{self.game_code}|\n data => |{self.session_data}|\nscope => |{self.scope}| \n\n')
		if self.session_data['status'] == 'started':
			await self.update_session_status()
			await self.game_handler.launch_game(self.session_data['players'])
		await self.send_to_group(self.session_data)

	async def	receive(self, text_data):
		data = json.loads(text_data)
		# print(f'\n\n data = {data}\ntext_data = {text_data} \n\n')
		if data.get('status') == 'waiting':
			self.session_data = await self.get_session_data(self.session_id)
			return
		if self.session_data['status'] != 'waiting':
			if self.game_handler is None:
				self.game_handler = await self.get_game_handler()
			if self.game_code != 20:
				player_move = data.get('player_move')
				if player_move:
					player_move['player'] = self.session_data['players'][self.username]['id']
					data['player_move'] = player_move
			await self.game_handler.receive(data)

	async def	send_to_group(self, message):
		await self.channel_layer.group_send(self.session_id, {"type": "session.msg", "message": message})

	async def	session_msg(self, event):
		message = event["message"]
		await self.send(text_data=json.dumps({"message": message}))

	async def	disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.session_id,
			self.channel_name
		)
		await self.decrement_connection_count(self.session_id)

	@database_sync_to_async
	def	get_game_handler(self):
		session_data = cache.get(self.session_id)
		if session_data['game_handler']:
			self.game_handler = session_data['game_handler']
		else:
			if self.game_name == 'pong':
				self.game_handler = PongHandler(self)
				self.session_data['game_handler'] = self.game_handler
				cache.set(self.session_id, self.session_data)

	# @database_sync_to_async
	# async def	update_session_data(self):
	# 	players = {'players': {}}
	# 	connected_players = 0
	# 	awaited_players = self.session_data['still_available']
	# 	for i, player in enumerate(self.session_data['players']):
	# 		if player['connected']:
	# 			self.session_data['connected_players']
	# 		awaited_players -= 1
	# 		key_name = f"player{i + 1}_name"
	# 		if self.session_data['players'][player]:
	# 			players['players'][key_name] = player
	# 			connected_players += 1
	# 	message = {
	# 		**players,
	# 		'game': self.game_name,
	# 		'awaited_players': awaited_players,
	# 		'connected_players': connected_players,
	# 		'session_id': self.session_id,
	# 		'status': 'started' if self.players_max == connected_players else 'waiting',
	# 		'winner': None,
	# 		'game_state': 'waiting',
	# 	}

	# 	{
	# 	'players': players,
	# 	'game': game_name,
	# 	'awaited_players': awaited_connections,
	# 	'connected_players': 0,
	# 	'session_id': session_id,
	# 	'status': 'waiting',
	# 	'winner': None,
	# 	'game_state': 'waiting',
	# 	}

	# 	return message

	# async def	wait_others(self):
	# 	while self.players_max != self.session_data['']

# TODO
	async def	end_game(self):
		pass

	@staticmethod
	@database_sync_to_async
	def get_session_data(session_id):
		return cache.get(session_id)

	# @staticmethod
	# @database_sync_to_async
	# def get_connections(session_id):
	# 	session_data = cache.get(session_id)
	# 	return session_data['still_available'] if session_data else -1

	@database_sync_to_async
	def	update_session_status(self):
		self.session_data['status'] = 'started'
		cache.set(self.session_id, self.session_data)

	# @staticmethod
	@database_sync_to_async
	def change_connection_status(self):
		# session_data = cache.get(session_id)
		self.session_data['connected_players'] += 1
		player = self.session_data['players'].get(self.username)
		if player:
			self.session_data['players'][self.username]['connected'] = True
		else:
			self.session_data['players'] = {self.username: {'connected': True, 'id': self.session_data['connected_players']}}
		# self.session_data['players'][self.username] = True
		if self.session_data['connected_players'] == self.session_data['awaited_players']:
			self.session_data['status'] = 'started'
		# print(f'\n\ntest before players => {self.session_data['players']}\n\n')
		# session_data['players'][username] = True
		cache.set(self.session_id, self.session_data)
		
		# print(f'\n\ntest after players => {cache.get(self.session_id)['players']}\n\n')

# TODO REFACTO
	@staticmethod
	@database_sync_to_async
	def decrement_connection_count(session_id):

		# Decrement the connection count for the session
		# session_data = cache.get(session_id)
		# if session_data:
		# 	session_data['connections'] -= 1
		# 	if session_data['connections'] <= 0:
		# 		cache.delete(session_id)
		# 	else:
		# 		cache.set(session_id, session_data)
		pass

class PongHandler():

	def	__init__(self, consumer):
		self.consumer = consumer
		self.game_code = consumer.game_code

	async def	launch_game(self, players_name):
		self.message = self.consumer.session_data
		self.game = PongGame(players_name)
		await self.reset_game()
		if 'bot' in self.message['players']:
			# init_bot()
			pass

	async def	reset_game(self):
		self.game.reset_game()
		self.loop_task = asyncio.create_task(self.game_loop())


	async def	receive(self, text_data):
		player_move = text_data.get('player_move')
		if player_move:
			await self.game.move_player_paddle(player_move)

	async def	game_loop(self):
		while True:
			await self.send_game_state()
			await asyncio.sleep(0.1)

	async def	send_game_state(self):
		await self.game.update()
		game_state = await self.game.serialize()
		self.message['game_state'] = game_state
		await self.consumer.send_to_group(self.message)
		await self.end_game(game_state)

	async def	cancel_loop(self):
		if hasattr(self, 'loop_task'):
			self.loop_task.cancel()

	async def	end_game(self, gs, winner=None):
		if gs['player1_score'] != gs['winning_score'] and gs['player2_score'] != gs['winning_score']:
			return
		if winner is None:
			winner = gs['player1_name'] if gs['player2_score'] < gs['player1_score'] else gs['player2_name']	# TODO refacto to 2vs2 and tournament
		if self.game_code != 20: # mode vs 'guest', does not save scores
			match_result = {gs['player1_name']: gs['player1_score'],
					gs['player2_name']: gs['player2_score']}
			create_match(match_result, winner)	# TODO refacto to 2vs2 and tournament
		self.message['winner'] = winner
		self.message['status'] = 'finished'
		await self.cancel_loop()
		await self.consumer.send_to_group(self.message)

		# send notification + restart the game
