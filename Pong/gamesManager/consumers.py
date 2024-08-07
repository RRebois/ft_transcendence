import json

import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
# from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from django.core.cache import cache
from .games.pong import PongGame
import uuid

class	GameManagerConsumer(AsyncWebsocketConsumer):

	async def	connect(self):
		self.game_name = self.scope['url_route']['kwargs']['game_name']
		self.players_nb = int(self.scope['url_route']['kwargs']['players_nb'])
		self.session_id = self.scope['url_route']['kwargs']['session_id']
		self.players_count = self.get_connections(self.session_id)
		self.game_handler = PongHandler(self) #if self.game_name == 'pong' else self.purrinha_handler
		#TODO add a username

		if self.game_name != 'pong' and self.game_name != 'purrinha':
			await self.close()	#TODO change to send the error msg
			pass
		if self.players_nb < 1 or self.players_nb > 4:
			await self.close()	#TODO change to send the error msg
			pass
		if not self.check_session_exists(self.session_id):
			await self.close()	#TODO change to send the error msg
			pass
		if self.players_count >= self.players_nb:
			await self.close()	#TODO change to send the error msg
			pass
		self.increment_connection_count(self.session_id)
		await self.channel_layer.group_add(
			self.session_id,
			self.channel_name
		)
		self.players_count += 1
		self.accept()

		message = self.get_message()
		if self.players_count == self.players_nb:	#TODO update to all cases
			players_name = []
			for k,v in message.items():
				if k.startswith('player'):
					players_name.append(v)
			self.game_handler.launch_game(players_name)
		await self.send_to_group(message)

	async def	receive(self, text_data):
		data = json.loads(text_data)
		self.game_handler.receive(data)

	async def	send_to_group(self, message):
		await self.channel_layer.group_send(self.session_name, {"type": "session.msg", "message": message})

	async def	session_msg(self, event):
		message = event["message"]
		await self.send(text_data=json.dumps({"message": message}))

	async def	disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.session_id,
			self.channel_name
		)
		self.decrement_connection_count(self.session_id)

#TODO update to when the session already exists
	async def	get_message(self):
		player2 = 'waiting'
		if self.players_nb == 1:
			player2 = 'bot'
		if self.players_nb == 2:
			player2 = 'guest'
		message = {
			'game': self.game_name,
			'awaited_players': self.players_nb,
			'connected_players': self.players_count,
			'session_id': self.session_id,
			'player1': self.channel_name, #TODO put the username
			'player2': player2,
			'status': 'started' if self.players_count == self.players_nb else 'waiting',
			'game_state': 'waiting',
		}
		if self.players_nb == 4:
			message['player3'] = player2
			message['player4'] = player2
		return message

	@staticmethod
	@database_sync_to_async
	def check_session_exists(session_id):
		return cache.get(session_id) is not None

	@staticmethod
	@database_sync_to_async
	def get_connections(session_id):
		session_data = cache.get(session_id)
		return session_data['connections']

	# @staticmethod
	# @database_sync_to_async
	# def create_session(session_id):
	# 	# Create session state in cache or database
	# 	cache.set(session_id, {'connections': 0, 'winner': None})

	@staticmethod
	@database_sync_to_async
	def increment_connection_count(session_id):
		# Increment the connection count for the session
		session_data = cache.get(session_id)
		session_data['connections'] += 1
		cache.set(session_id, session_data)

	@staticmethod
	@database_sync_to_async
	def decrement_connection_count(session_id):
		# Decrement the connection count for the session
		session_data = cache.get(session_id)
		if session_data:
			session_data['connections'] -= 1
			if session_data['connections'] <= 0:
				cache.delete(session_id)
			else:
				cache.set(session_id, session_data)


	# async def	pong_handler(self):
	# 	self.loop_task = asyncio.create_task(self.pong_loop())


	# async def pong_loop(self):
	# 	await asyncio.sleep(0.2)
	# 	while True:
	# 		await self.send_game_state()
	# 		await asyncio.sleep(0.1)


class PongHandler():
	# game = PongGame()

	def	__init__(self, consumer):
		self.consumer = consumer

	async def	launch_game(self, players_name):
		self.message = self.consumer.get_message()
		self.game = PongGame(players_name)
		self.loop_task = asyncio.create_task(self.game_loop())


	# async def disconnect(self, close_code):
	# 	await self.channel_layer.group_discard(
	# 		self.game_id,
	# 		self.channel_name
	# 	)
	# 	await sync_to_async(GameConsumer.decrement_connection_count)(self.session_name)
	# 	if hasattr(self, 'loop_task'):
	# 		self.loop_task.cancel()
	# 		#TODO handle disconnection

	async def receive(self, text_data):
		# data = json.loads(text_data)
		player_move = text_data.get('player_move')
		if player_move:
			self.game.move_player_paddle(player_move)

	async def game_loop(self):
		# await asyncio.sleep(0.2)
		while True:
			await self.send_game_state()
			await asyncio.sleep(0.1)


	async def send_game_state(self):
		self.game.update()
		game_state = self.game.serialize()
		self.message['game_state'] = game_state
		await self.consumer.send_to_group(self.message)
