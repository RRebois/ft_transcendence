import asyncio
import json
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.http import HttpResponse, HttpRequest
from django.middleware.csrf import get_token
from rest_framework.exceptions import AuthenticationFailed

from gamesManager.consumers import GameManagerConsumer
from gamesManager.views import GameManagerView
from userManagement.utils import generate_JWT, generate_refresh_JWT
from userManagement.serializer import LoginSerializer


class TerminalConsumer(AsyncWebsocketConsumer):

	async def connect(self):
			self.ready = False
			self.game_consumer = None
			self.error_message = None
			headers = dict(self.scope['headers'])

			self.commands = {
				'help': self.handle_help,
				'join_game': self.handle_join_game,
				'quit': self.handle_leave_game,
			}
			await self.accept()
			self.user = await self.handle_login(headers)
			if not self.user:
				await self.send(self.error_message)
				await self.close()
				return
			self.scope["user"] = self.user
			self.username = self.user.username
			self.handler = GameStateHandler(self.username)
			await self.send(f'Welcome, {self.user.username}.')
			await self.handle_help()

	async def disconnect(self, close_code):
		print("\n\t\t\tDISCONNECT")
		if self.game_consumer:
			await self.game_consumer.disconnect(close_code)
		if self.user:
			await self.user_disconnection()

	async def session_msg(self, event):

		message = event["message"]
		response = await self.handler.parse_game_state(message)
		for k in response.keys():
			if k == "ready" and not self.ready:
				self.ready = True
				await self.game_consumer.receive(json.dumps({"game_status": True}))
			await self.send(text_data=response[k])
			if k == "end_game":
				self.game_consumer = None
				self.ready = False

	async def receive(self, text_data):
			data = text_data.lower()
			if self.game_consumer:
				commands = {
					"w": -1,
					"s": 1,
				}
				if data in commands:
					for _ in range(4):
						await self.send_paddle_move(commands[data])
				elif data == "quit":
					await self.handle_leave_game()
			else:
				if data in self.commands:
					await self.commands[data]()
				else:
					await self.send('Unknown command.\nType "help" to see the available commands')

	async def send_paddle_move(self, move):
		player_move = {'player_move': {
			'player': self.player_id,
			'direction': move,
		}}
		await self.game_consumer.receive(json.dumps(player_move))

	async def handle_help(self):
		await self.send('Here you can play pong.\
			\nType "join_game" to play against another player\
			\n\tWhen the game starts you can type "w" to move up or "s" to move down\
			\n\tattention here you\'ll see the game in reduced dimensions\
			\nType "quit" to leave the game or to close the connection\
			\nType "help" to see this again')

	@sync_to_async
	def user_disconnection(self):
		self.user.status = "offline"
		self.user.save()

	async def handle_leave_game(self):
		if self.game_consumer:
			await self.game_consumer.disconnect(1001)
			self.game_consumer = None
			await self.send("You left the match.")
		else:
			await self.send("You are leaving the server.\nBye!")
			await self.user_disconnection()
			await self.close()

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
			self.request = HttpRequest()
			user.status = "online"
			user.save()
			return user
		except AuthenticationFailed as e:
			self.error_message = str(e)
			return None

	@sync_to_async
	def fetch_game_consumer(self, game_code):
		self.request.COOKIES['csrftoken'] = get_token(self.request)
		self.request.COOKIES['jwt_access'] = generate_JWT(self.user)
		self.request.COOKIES['jwt_refresh'] = generate_refresh_JWT(self.user)
		view = GameManagerView()
		response = view.get(self.request, "pong", game_code)
		data = json.loads(response.content)
		print(f"\n\t\t\tdata => {data}")
		route = data.get("ws_route")
		if route:
			print(f"\n\t\t\tinside fetch => {data}")
			scope = {
				'type': 'websocket',
				'path': route,
				'user': self.user,
				'path_remaining': '',
				'url_route': {
					'args': (),
					'kwargs': {
						'game_name': 'pong',
						'game_code': game_code,
						'session_id': data.get('session_id'),
						'token': self.request.COOKIES['jwt_access']
					}}
				}
			return scope
		return None


	async def handle_join_game(self):
		self.game_consumer = GameManagerConsumer()
		scope = await self.fetch_game_consumer(22)
		if scope:
			await self.game_consumer.hydrate(scope, self.channel_layer, self.channel_name)
			await self.game_consumer.handle_connection()
			self.player_id = self.game_consumer.session_data['players'][self.username]['id']
		else:
			self.game_consumer = None


class GameStateHandler():

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
			response["end_game"] = f"\n\n\t\tYou won!\n\t\t{self.enemy} has left the match.\n\n"
			self.new_game = True
		elif msg["winner"]:
			final_msg = "Congratulations, you won!" if msg["winner"][0] == self.username else "\tYou lost!"
			response["end_game"] = f"\n\n\t{final_msg}\n\t{self.p1_name[:20]} {self.p1_score} - {self.p2_score} {self.p2_name[:20]}\n\n"
			self.new_game = True
		elif msg["status"] == "waiting":
			response["waiting"] = "\n\n\t\tWaiting for another player\n\n"
		elif msg["status"] == "ready":
			game_frame = await self.create_frame()
			response["ready"] = game_frame
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

	async def create_frame(self):
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
		final_frame = score_line + '\n'
		for line in game_frame:
			final_frame += '|' + ''.join(line) + '|\n'
		final_frame += frame
		return final_frame
