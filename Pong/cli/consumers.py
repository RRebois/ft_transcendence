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
			self.game_consumer = None
			self.error_message = None
			self.handler = GameStateHandler()
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
			self.username = self.user.username
			scope = [{sc: self.scope[sc]} for sc in self.scope]
			await self.send(f'{scope}\n{self.user.username} conectado ao servidor. Type "help" to see the available commands')

	async def disconnect(self, close_code):
		print("\n\t\t\tDISCONNECT")
		if self.game_consumer:
			await self.game_consumer.disconnect(close_code)
		if self.user:
			await self.user_disconnection()

	async def session_msg(self, event):
		# {"players": {"testing2": {"id": 1, "connected": true}, 
		# "fbelfort": {"id": 2, "connected": true}}, 
		# "game": "pong", 
		# "awaited_players": 2, 
		# "connected_players": 2, 
		# "session_id": "pong_bd35deb62d984086b2270afdb50c3582", 
		# "status": "started", 
		# "winner": null, 
		# "tournament_name": null, 
		# "game_state": {
		# 		"players": {"player1": {"name": "testing2", "pos": {"x": 10, "y": 110}}, "player2": {"name": "fbelfort", "pos": {"x": 590, "y": 110}}}, 
		# 		"ball": {"x": 237, "y": 137.90000000000012, "radius": 10, "x_vel": -3, "y_vel": -0.1}, 
		# 		"left_score": 0, 
		# 		"right_score": 0, 
		# 		"game_width": 600, 
		# 		"game_height": 280, 
		# 		"paddle_width": 10, 
		# 		"paddle_height": 60, 
		# 		"winning_score": 1, 
		# 		"new_round": false}, 
		# "deconnection": false}

		message = event["message"]
		game_frame = await self.handler.parse_game_state(message)
		for line in game_frame:
			await self.send(line)
			# await self.send(text_data=json.dumps(message))

	async def receive(self, text_data):
			data = text_data.lower()
			# commands = self.commands
			if self.game_consumer:
				commands = {
					"w": -1,
					"s": 1,
				}
				if data in commands:
					await self.send_paddle_move(commands[data])
			else:
				if data in self.commands:
					await self.commands[data]()
				else:
					await self.send('Unknown command.\nType "help" to see the available commands')


			# try:
			# 	data = json.loads(text_data)
			# 	error_msg = "ok"
			# except Exception as e:
			# 	data = text_data
			# 	error_msg = str(e)
			# await self.send(json.dumps({
			# 	'type': 'response',
			# 	'message': data,
			# 	'message_error': error_msg,
			# }))

	async def send_paddle_move(self, move):
		# {"player_move":{"player":2,"direction":1}}
		player_move = {'player_move': {
			'player': self.game_consumer.session_data['players'][self.username]['id'],
			'direction': move,
		}}
		await self.game_consumer.receive(json.dumps(player_move))

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
	def fetch_game_consumer(self, game_consumer):
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
			# return route
			print(f"\n\t\t\tinside fetch => {data}")
			# game_consumer = GameManagerConsumer()
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
			return scope
			# game_consumer.scope = scope
			# return game_consumer
		return None


	async def handle_join_game(self):
		self.game_consumer = GameManagerConsumer()
		scope = await self.fetch_game_consumer(self.game_consumer)
		if scope:
			await self.game_consumer.hydrate(scope, self.channel_layer, self.channel_name)
			await self.game_consumer.handle_connection()
		else:
			self.game_consumer = None
		# 	# await self.game_consumer.connect()
		# 	server_addr = os.environ.get("SERVER_URL")
		# 	uri = "wss" + server_addr[5:]
		# 	uri += route + self.access_token
		# 	await self.send(uri)

		# 	async with websockets.connect(uri) as websocket:
		# 	# Enviar uma mensagem inicial, como um comando para começar a partida
		# 		# initial_data = json.dumps({"game_status": "start"})
		# 		# await websocket.send(initial_data)

		# 		# Receber o estado do jogo continuamente
		# 		while True:
		# 			try:
		# 				response = await websocket.recv()
		# 				game_state = json.loads(response)
		# 				await self.send(json.dumps(game_state))
						
		# 				# Enviar comandos (exemplo de movimento do jogador)
		# 				# player_move = json.dumps({"player_move": {"direction": "up"}})
		# 				await websocket.send(player_move)
						
		# 			except websockets.ConnectionClosed:
		# 				print("Conexão com o WebSocket encerrada.")
		# 				break

		# # uri = "ws://localhost:8000/ws/consumer1/"  # URL do consumer
		# # async with websockets.connect(uri) as websocket:
		# # 	await websocket.send("Mensagem de teste")
		# # 	response = await websocket.recv()
		# # 	print(f"Resposta do Consumer1: {response}")


class GameStateHandler():

			# {"players": {"testing2": {"id": 1, "connected": true}, 
		# "fbelfort": {"id": 2, "connected": true}}, 
		# "game": "pong", 
		# "awaited_players": 2, 
		# "connected_players": 2, 
		# "session_id": "pong_bd35deb62d984086b2270afdb50c3582", 
		# "status": "started", 
		# "winner": null, 
		# "tournament_name": null, 
		# "game_state": {
		# 		"players": {"player1": {"name": "testing2", "pos": {"x": 10, "y": 110}}, "player2": {"name": "fbelfort", "pos": {"x": 590, "y": 110}}}, 
		# 		"ball": {"x": 237, "y": 137.90000000000012, "radius": 10, "x_vel": -3, "y_vel": -0.1}, 
		# 		"left_score": 0, 
		# 		"right_score": 0, 
		# 		"game_width": 600, 
		# 		"game_height": 280, 
		# 		"paddle_width": 10, 
		# 		"paddle_height": 60, 
		# 		"winning_score": 1, 
		# 		"new_round": false}, 
		# "deconnection": false}

		def __init__(self):
			pass

		async def parse_game_state(self, msg):
			# return None
			response = ""
			if msg["deconnection"]:
				# fulano desconectou e voce venceu
				pass
			if msg["winner"]:
				# O jogo acabou e fulano venceu de X x y 
				pass
			if msg["status"] == "waiting":
				# waiting um oponente
				pass
			else:
				game_frame = []
				game_width = int(msg["game_state"]["game_width"])
				game_height = int(msg["game_state"]["game_height"])
				player1_pos = msg["game_state"]["players"]["player1"]["pos"]
				player2_pos = msg["game_state"]["players"]["player2"]["pos"]
				player1_name = msg["game_state"]["players"]["player1"]["name"]
				player2_name = msg["game_state"]["players"]["player2"]["name"]
				player1_score = msg["game_state"]["left_score"]
				player2_score = msg["game_state"]["right_score"]
				ball = msg["game_state"]["ball"]
				paddle_height = int(msg["game_state"]["paddle_height"])
				game_frame.append("X" * (game_width // 10))
				game_frame.append(f'{{:^{game_width // 10}}}'.format(f'{player1_name[:10]} {player1_score} - {player2_score} {player2_name[:10]}'))
				for y in range(game_height // 10):
					line = "|"
					for x in range(game_width // 10):
						# if (player1_pos["x"] - 10) // 10 > x and ((player1_pos["y"] // 10) <= y <= (player1_pos["y"] + paddle_height) // 10):
						if 0 == x and ((player1_pos["y"] // 10) <= y <= (player1_pos["y"] + paddle_height) // 10):
							char = "Y"
						elif player2_pos["x"] // 10 <= x and ((player2_pos["y"] // 10) <= y <= (player2_pos["y"] + paddle_height) // 10):
						# if player2_pos["x"] // 10 <= x and ((player2_pos["y"] // 10) <= y <= (player2_pos["y"] + paddle_height) // 10):
							char = "E"
						elif (ball["x"] // 10) == x and (ball["y"] // 10) == y:
							char = "O"
						else:
							char = "."
						line += char
					line += "|"
					game_frame.append(line)
				# game_frame.append("X" * game_width)
				return game_frame
			return response