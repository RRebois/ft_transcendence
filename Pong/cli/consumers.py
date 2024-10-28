import json
import asyncio
import os
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.exceptions import AuthenticationFailed
from asgiref.sync import sync_to_async

import requests
from django.urls import reverse
from django.http import HttpRequest
from django.middleware.csrf import get_token

from userManagement.views import LoginView
from userManagement.models import User

from userManagement.serializer import LoginSerializer

class TerminalConsumer(AsyncWebsocketConsumer):

	async def connect(self):
			self.user = None
			self.username = None
			self.current_game = None
			self.game_connection = None
			self.error_message = None
			headers = dict(self.scope['headers'])

			await self.accept()
			self.user = await self.handle_login(headers)
			if not self.user:
				await self.send(self.error_message)
				await self.close()

			scope = [{sc: self.scope[sc]} for sc in self.scope]
			await self.send(f'{scope}\n{self.user.username} conectado ao servidor. Use "help" para ver os comandos disponiveis.\nusername:')
			# 	json.dumps({
			# 	'type': 'welcome',
			# 	'message': 'Conectado ao servidor. Use "help" para ver os comandos disponiveis.'
			# }))

	async def disconnect(self, close_code):
		if self.game_connection:
			await self.game_connection.disconnect(close_code)

	async def receive(self, text_data):
			if not self.user:
				await self.handle_login(text_data)
				return
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

	@sync_to_async
	def handle_login(self, headers):

		username = headers.get(b'username', b'').decode('utf-8')
		password = headers.get(b'password', b'').decode('utf-8')
		print(f"\n\t\t\tnome => {username}\nsenha => {password}")
		if not username or not password:
			self.error_message = "You have to send your username and password in the headers in order to login"
			return None
		serializer = LoginSerializer(data={"username": username, "password": password})
		try:
			serializer.is_valid(raise_exception=True)
			# print(f'\t\t\tPASSEI AQUI')
			user = serializer.validated_data['user']
			# print(f'\t\t\tuser => {user}')
			if user.status == "online" or user.status == "in-game":
				self.error_message = "User already have an active session"
				return None
			self.access_token = serializer.validated_data['jwt_access']
			self.refresh_token = serializer.validated_data['jwt_refresh']
			return user
# 			think about it
			# if user.tfa_activated:
			# 	return JsonResponse({
			# 		'otp_required': True,
			# 		'user_id': user.id,
			# 	}, status=status.HTTP_200_OK)
		except AuthenticationFailed as e:
			self.error_message = str(e)
			return None




		# if not self.username:
		# 	self.username = data
		# 	await self.send("password:")
		# else:
		# 	url = os.environ.get("SERVER_URL")
		# 	url += reverse("login")
		# 	print(f"\n\t\t\turl => {url}")
		# 	data = {
		# 		'username': self.username,
		# 		'password': data,
		# 	}
		# 	login = requests.post(url, data=data)

		# 	# request = HttpRequest()
		# 	# view = LoginView.as_view(actions={'post': 'post'})
		# 	# request.method = 'POST'
		# 	# request.content_type = 'application/json'
		# 	# csrf_token = get_token(request)
		# 	# request.COOKIES['csrftoken'] = csrf_token
		# 	# request.META['HTTP_X_CSRFTOKEN'] = csrf_token
		# 	# request.data = {
		# 	# 		'username': self.username,
		# 	# 		'password': data,
		# 	# 	}
		# 	# login = view(request)
		# 	print(f"\n\t\t\tHANDLE LOGIN => {login}")
		# 	# await self.send(json.dumps(login))
