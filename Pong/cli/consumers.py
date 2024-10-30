import asyncio
import json

from asgiref.sync import sync_to_async
# import websockets
# import os
from channels.generic.websocket import AsyncWebsocketConsumer
# import requests
# from django.urls import reverse
from django.http import HttpResponse, HttpRequest
from django.middleware.csrf import get_token
from gamesManager.consumers import GameManagerConsumer
from gamesManager.views import GameManagerView
from rest_framework.exceptions import AuthenticationFailed
# from userManagement.views import LoginView
from userManagement.models import User
from userManagement.serializer import LoginSerializer


class TerminalConsumer(AsyncWebsocketConsumer):

	async def connect(self):
			self.user = None
			self.current_game = None
			self.game_consumer = None
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
			self.username = self.user.username
			self.handler = GameStateHandler(self.username)
			scope = [{sc: self.scope[sc]} for sc in self.scope]
			await self.send(f'{scope}\n{self.user.username} conectado ao servidor.')
			await self.handle_help()

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
		responses = ["refresh", "waiting", "end_game"]

		message = event["message"]
		# await self.send(text_data=json.dumps(message))
		response = await self.handler.parse_game_state(message)
		key_response = response.keys()
		if key_response in responses:
			await self.send(text_data=response[key_response])
			if key_response == "end_game":
				self.game_consumer = None
			# for line in response["refresh"]:
			# 	await self.send(text_data=json.dumps(line))

	async def receive(self, text_data):
			data = text_data.lower()
			# commands = self.commands
			if self.game_consumer:
				commands = {
					"w": -1,
					"s": 1,
				}
				if data in commands:
					for _ in range(4):
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
			'player': self.player_id,
			'direction': move,
		}}
		await self.game_consumer.receive(json.dumps(player_move))

	async def handle_help(self):
		await self.send(f'Welcome, {self.username}.\
			\nHere you can play pong.\
			\nType "join_game" to play against another player\
			\nor type "play_bot" to play with the bot.\
			\n\tWhen the game starts you can type "w" to move up or "s" to move down\
			\n\tattention here you\'ll see the game in reduced dimensions\
			\nType "help" to see this again')

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
			# self.csrf_token = get_token(HttpResponse())
			user.status = "online"
			user.save()
			return user
		except AuthenticationFailed as e:
			self.error_message = str(e)
			return None

	@sync_to_async
	def fetch_game_consumer(self):
		request = HttpResponse()
		request.set_cookie(key='jwt_access', value=self.access_token, httponly=True, samesite='Lax', secure=True,
							path='/')
		request.set_cookie(key='jwt_refresh', value=self.refresh_token, httponly=True, samesite='Lax', secure=True,
							path='/')
		request.set_cookie(key='csrftoken', value=get_token(HttpRequest()), samesite='Lax', secure=True, path='/')
		# request.COOKIES['csrftoken'] = self.csrf_token
		# request.COOKIES['jwt_access'] = self.access_token
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
		scope = await self.fetch_game_consumer()
		if scope:
			await self.game_consumer.hydrate(scope, self.channel_layer, self.channel_name)
			await self.game_consumer.handle_connection()
			self.player_id = self.game_consumer.session_data['players'][self.username]['id']
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

	REDUCTION = 10
	COUNTER = 5

	def __init__(self, username):
		self.new_game = True
		self.counter = GameStateHandler.COUNTER
		self.username = username
		self.p1_pos = None
		self.p1_x = None
		self.p1_name = None
		self.p1_score = None
		self.p2_pos = None
		self.p2_x = None
		self.p2_name = None
		self.p2_score = None
		self.width = None
		self.height = None
		self.paddle_height = None
		self.ball = None
		self.old_ball = []

	async def fill_data(self, msg):
		if msg["game_state"] != "waiting":
			self.new_game = False
			gs = msg["game_state"]
			self.p1_pos = gs["players"]["player1"]["pos"]["y"] // GameStateHandler.REDUCTION
			self.p1_x = gs["players"]["player1"]["pos"]["x"] // GameStateHandler.REDUCTION
			self.p1_name = gs["players"]["player1"]["name"]
			self.p1_score = gs["left_score"]
			self.p2_pos = gs["players"]["player2"]["pos"]["y"] // GameStateHandler.REDUCTION
			self.p2_x = gs["players"]["player2"]["pos"]["x"] // GameStateHandler.REDUCTION
			self.p2_name = gs["players"]["player2"]["name"]
			self.p2_score = gs["right_score"]
			self.width = gs["game_width"] // GameStateHandler.REDUCTION
			self.height = gs["game_height"] // GameStateHandler.REDUCTION
			self.paddle_height = gs["paddle_height"] // GameStateHandler.REDUCTION
			self.ball = gs["ball"]
			self.enemy = self.p2_name if self.p2_name != self.username else self.p1_name

	async def update_data(self, msg):
		if msg["game_state"] != "waiting":
			gs = msg["game_state"]
			self.p1_pos = gs["players"]["player1"]["pos"]["y"] // GameStateHandler.REDUCTION
			self.p1_score = gs["left_score"]
			self.p2_pos = gs["players"]["player2"]["pos"]["y"] // GameStateHandler.REDUCTION
			self.p2_score = gs["right_score"]
			self.ball = gs["ball"]

	async def parse_game_state(self, msg):
		if self.new_game:
			await self.fill_data(msg)
		response = {}
		if msg["deconnection"]:
			# fulano desconectou e voce venceu
			response["end_game"] = f"\n\n\t\tYou won!\n\t\t{self.enemy} has left the match.\n\n"
			self.new_game = True
		elif msg["winner"]:
			# O jogo acabou e fulano venceu de X x y
			await self.update_data(msg)
			final_msg = "Congratulations, you won!" if msg["winner"] == self.username else "You lost!"
			response["end_game"] = f"\n\n\t\tYou won!\n\t{self.p1_name[:20]} {self.p1_score} - {self.p2_score} {self.p2_name[:20]}\n\n"
			self.new_game = True
		elif msg["status"] == "waiting":
			# waiting um oponente
			response["waiting"] = "\n\n\t\tWaiting for another player\n\n"
		# else:
		elif msg["game_state"] != "waiting":
			if msg["game_state"]["new_round"]:
				self.counter = 0
				self.old_ball = []
			if self.counter:
				self.counter -= 1
				self.old_ball.append(msg["game_state"]["ball"])
			if not self.counter:
				self.counter = GameStateHandler.COUNTER
				await self.update_data(msg)
				game_frame = await self.create_frame()
				response["refresh"] = game_frame
		return response

	# async def make_grid(self):
	# 	# max_width = self.width + 2
	# 	# max_height = self.height + 4
	# 	blank_frame = [['.' for _ in range(self.width)] for _ in range(self.height)]
	# 	# frame = '-' * max_width
	# 	# blank_frame[0] = blank_frame[-1] = frame
	# 	# blank_frame[1] = f'{{:^{max_width}}}'\
	# 	# 			.format(f'{self.p1_name[:20]} {self.p1_score} - {self.p2_score} {self.p2_name[:20]}')
	# 	return blank_frame

	async def create_frame(self):
		# game_frame = self.blank_frame.copy()
		game_frame = [['.' for _ in range(self.width)] for _ in range(self.height)]
		for ball in self.old_ball:
			ball_x = int(ball["x"] / GameStateHandler.REDUCTION)
			ball_y = int(ball["y"] / GameStateHandler.REDUCTION)
			game_frame[ball_y][ball_x] = 'o'
		ball_x = int(self.ball["x"] / GameStateHandler.REDUCTION)
		ball_y = int(self.ball["y"] / GameStateHandler.REDUCTION)
		game_frame[ball_y][ball_x] = '@'
		for i in range(self.p1_pos, self.p1_pos + self.paddle_height + 1):
			char = 'Y' if self.p1_name == self.username else 'E'
			game_frame[i][0] = char
		for i in range(self.p2_pos, self.p2_pos + self.paddle_height + 1):
			char = 'Y' if self.p2_name == self.username else 'E'
			game_frame[i][self.p2_x] = char
		self.old_ball.clear()
		final_frame = []
		frame = '-' * (self.width + 2)
		score_line = f'{{:^{self.width + 2}}}'\
					.format(f'{self.p1_name[:20]} {self.p1_score} - {self.p2_score} {self.p2_name[:20]}')
		# final_frame.append(frame)
		final_frame.append(score_line)
		for line in game_frame:
			final_frame.append('|' + ''.join(line) + '|')
		final_frame.append(frame)
		final_frame2d = '\n'.join(final_frame)
		# game_frame.clear()
		return final_frame2d
