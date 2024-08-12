import json

import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from .games.pong import PongGame
from matchs.views import create_match


class	GameManagerConsumer(AsyncWebsocketConsumer):

	async def	connect(self):
		http_user = True
		self.game_name = self.scope['url_route']['kwargs']['game_name']
		self.game_code = int(self.scope['url_route']['kwargs']['game_code'])
		self.players_max = 4 if self.game_code == 40 else 2
		self.session_id = self.scope['url_route']['kwargs']['session_id']
		self.session_data = await self.get_session_data(self.session_id)
		self.game_handler = PongHandler(self) #if self.game_name == 'pong' else self.purrinha_handler
		self.user = self.scope['user']
		#TODO add a username

		await self.accept()
		if self.game_name not in ['pong', 'purrinha']:
			await self.close()	#TODO change to send the error msg
			pass
		if self.game_code not in [10, 20, 21, 22, 23, 40]:
			await self.close()	#TODO change to send the error msg
			pass
		if self.session_data is None:
			await self.close()	#TODO change to send the error msg
			pass
		if self.user.username not in self.session_data['players']:
			await self.close()	#TODO change to send the error msg
			pass
		await self.change_connection_status(self.session_id, self.user.username)
		await self.channel_layer.group_add(
			self.session_id,
			self.channel_name
		)

		message = await self.get_message()
		print(f'\n\n\nuser => |{self.user}|\ncode => |{self.game_code}|\n data => |{self.session_data}|scope => |{self.scope}| \n\n')
		if message['status'] == 'started':
			# players_name = self.session_data['players'].keys()
			# for k,v in message.items():
			# 	if k.startswith('player'):
			# 		players_name.append(v)
			# await self.game_handler.launch_game(players_name)
			await self.game_handler.launch_game(message['players'])
		await self.send_to_group(message)

	async def	receive(self, text_data):
		data = json.loads(text_data)
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

#TODO update to when the session already exists
	async def	get_message(self):
		# player2 = 'waiting'
		# if self.players_nb == 1:		#CHANGE HERE TO game_code
		# 	player2 = 'bot'
		# if self.players_nb == 2:		#CHANGE HERE TO game_code
		# 	player2 = 'guest'
		players = {'players': {}}
		connected_players = 0
		awaited_players = self.session_data['still_available']
		for i, player in enumerate(self.session_data['players']):
			awaited_players += 1
			key_name = f"player{i + 1}_name"
			if self.session_data['players'][player]:
				players['players'][key_name] = player
				connected_players += 1
		message = {
			**players,
			'game': self.game_name,
			'awaited_players': awaited_players,
			'connected_players': connected_players,
			'session_id': self.session_id,
			# 'player1': self.channel_name, #TODO put the username
			# 'player2': player2,
			'status': 'started' if awaited_players == connected_players else 'waiting',
			'game_state': 'waiting',
		}
		return message

# TODO
	async def	end_game(self):
		pass

	@staticmethod
	@database_sync_to_async
	def get_session_data(session_id):
		return cache.get(session_id)

	@staticmethod
	@database_sync_to_async
	def get_connections(session_id):
		session_data = cache.get(session_id)
		return session_data['still_available'] if session_data else -1

	@staticmethod
	@database_sync_to_async
	def change_connection_status(session_id, username):
		session_data = cache.get(session_id)
		print(f'\n\ntest before players => {session_data['players']}\n\n')
		session_data['players'][username] = True
		cache.set(session_id, session_data)
		print(f'\n\ntest after players => {cache.get(session_id)['players']}\n\n')

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
		self.message = await self.consumer.get_message()
		self.game = PongGame(players_name)
		self.loop_task = asyncio.create_task(self.game_loop())
		if 'bot' in self.message['players']:
			# init_bot()
			pass

# TODO handle the inputs
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

	async def	cancel_loop(self):
		if hasattr(self, 'loop_task'):
			self.loop_task.cancel()

	async def	end_game(self, gs):
		if gs['player1_score'] != gs['winning_score'] and gs['player2_score'] != gs['winning_score']:
			pass
		if self.game_code == 20: # mode vs 'guest', does not save scores
			pass
		winner = gs['player1_name'] if gs['player2_score'] < gs['player1_score'] else gs['player2_name']
		match_result = {gs['player1_name']: gs['player1_score'],
				  gs['player2_name']: gs['player2_score']}
		create_match(match_result, winner)	# TODO refacto to 2vs2 and tournament

		# send notification + restart the game
