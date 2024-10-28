import json
import asyncio
# import websockets
# import os
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.exceptions import AuthenticationFailed
from asgiref.sync import sync_to_async

# import requests
# from django.urls import reverse
from django.http import HttpRequest
from django.middleware.csrf import get_token

# from userManagement.views import LoginView
from userManagement.models import User
from userManagement.serializer import LoginSerializer
from gamesManager.consumers import GameManagerConsumer, PongHandler
from gamesManager.views import GameManagerView

class TerminalConsumer(AsyncWebsocketConsumer):

	async def connect(self):
			self.user = None
			self.username = None
			self.current_game = None
			self.game_connection = None
			self.error_message = None
			headers = dict(self.scope['headers'])

			self.commands = {
				'help': self.handle_help,
				'join_game': self.handle_join_game,
				# 'make_move': self.handle_make_move,
				# 'leave_game': self.handle_leave_game,
				# 'list_games': self.handle_list_games
			}
			await self.accept()
			self.user = await self.handle_login(headers)
			if not self.user:
				await self.send(self.error_message)
				await self.close()
				return

			scope = [{sc: self.scope[sc]} for sc in self.scope]
			await self.send(f'{scope}\n{self.user.username} conectado ao servidor. Type "help" to see the available commands')

	async def disconnect(self, close_code):
		if self.user:
			await self.user_disconnection()
		if self.game_connection:
			await self.game_connection.disconnect(close_code)

	async def receive(self, text_data):
			data = text_data.lower()
			commands = self.commands
			if self.game_connection:
				commands = {
					"w": -1,
					"s": 1,
				}
			if data in commands:
				await commands[data]()
			else:
				await self.send('Unknown command.\nType "help" to see the available commands')


			try:
				data = json.loads(text_data)
				error_msg = "ok"
			except Exception as e:
				data = text_data
				error_msg = str(e)
			await self.send(json.dumps({
				'type': 'response',
				'message': data,
				'message_error': error_msg,
			}))

	async def handle_help(self):
		await self.send('Test\nType "help" to see the available commands')

	@sync_to_async
	def user_disconnection(self):
		self.user.status = "offline"
		self.user.save()


	@sync_to_async
	def handle_login(self, headers):

		username = headers.get(b'username', b'').decode('utf-8')
		password = headers.get(b'password', b'').decode('utf-8')
		if not username or not password:
			self.error_message = "You have to send your username and password in the headers in order to login"
			return None
		serializer = LoginSerializer(data={"username": username, "password": password})
		try:
			serializer.is_valid(raise_exception=True)
			user = serializer.validated_data['user']
			if user.status == "online" or user.status == "in-game":
				self.error_message = "User already have an active session"
				return None
			self.access_token = serializer.validated_data['jwt_access']
			self.refresh_token = serializer.validated_data['jwt_refresh']
			self.csrf_token = get_token(HttpRequest())
			user.status = "online"
			user.save()
			return user
		except AuthenticationFailed as e:
			self.error_message = str(e)
			return None

	@sync_to_async
	def fetch_game_consumer(self, game_connection):
		request = HttpRequest()
		request.COOKIES['csrftoken'] = self.csrf_token
		request.COOKIES['jwt_access'] = self.access_token
		view = GameManagerView()
		game_code = 22
		response = view.get(request, "pong", game_code)
		data = json.loads(response.content)
		print(f"\n\t\t\tdata => {data}")
		route = data.get("ws_route")
		if route:
			print(f"\n\t\t\tinside fetch => {data}")
			# game_connection = GameManagerConsumer()
			scope = {
				'type': 'websocket',
				'path': route,
				# 'raw_path': b'/ws/game/pong/22/pong_13545533b3e348599b5c7e054a589540/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInVzZXJuYW1lIjoiZmJlbGZvcnQiLCJleHAiOjE3MzAxMjM5MDksImlhdCI6MTczMDEyMzc4OX0.1C0s1t5dem3240XQ30HhYH7TgK0NQhavWrv6d96qszE/',
				# 'root_path': '',
				# 'headers': [
				# 	(b'upgrade', b'websocket'),
				# 	(b'connection', b'upgrade'),
				# 	(b'host', b'localhost'),
				# 	(b'x-real-ip', b'172.18.0.1'),
				# 	(b'x-forwarded-for', b'172.18.0.1'),
				# 	(b'x-forwarded-proto', b'https'),
				# 	(b'pragma', b'no-cache'),
				# 	(b'cache-control', b'no-cache'),
				# 	(b'user-agent', b'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'),
				# 	(b'accept-language', b'en-US,en'),
				# 	(b'origin', b'https://localhost:3000'),
				# 	(b'sec-websocket-version', b'13'),
				# 	(b'accept-encoding', b'gzip, deflate, br, zstd'),
				# 	(b'cookie', b'csrftoken=SIC3Pz7P4uOUiAXKBLcicFZRQhVYzUN9; jwt_access=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsImV4cCI6MTczMDEyMzc1NSwiaWF0IjoxNzMwMTIzNzQwfQ.ErSAYyNyLn_xUW1ZvLSykKeOREk-CuFMveUjoMBZSLo; jwt_refresh=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsImV4cCI6MTczMDEzMDk0MCwiaWF0IjoxNzMwMTIzNzQwfQ.ARC6J26WiYmfoC8qi2kyC6i4zlnGiq9tFQD8HyM_pkg'),
				# 	(b'sec-websocket-key', b'88RGIlNPKGUhKFoGRx21ew=='),
				# 	(b'sec-websocket-extensions', b'permessage-deflate; client_max_window_bits')],
				# 'query_string': b'',
				# 'client': ['172.18.0.5', 60884],
				# 'server': ['172.18.0.4', 8000],
				# 'subprotocols': [],
				# 'asgi': {'version': '3.0'},
				'user': self.user,
				'path_remaining': '',
				'url_route': {
					'args': (),
					'kwargs': {
						'game_name': 'pong',
						'game_code': game_code,
						'session_id': data.get('session_id'),
						'token': self.access_token
					}}
				}
			game_connection.scope = scope
			return game_connection
		return None


	async def handle_join_game(self):
		game_consumer = GameManagerConsumer()
		self.game_connection = await self.fetch_game_consumer(game_consumer)
		if self.game_connection:
			await self.game_connection.connect()

		# uri = "ws://localhost:8000/ws/consumer1/"  # URL do consumer
		# async with websockets.connect(uri) as websocket:
		# 	await websocket.send("Mensagem de teste")
		# 	response = await websocket.recv()
		# 	print(f"Resposta do Consumer1: {response}")