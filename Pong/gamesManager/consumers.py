import json

import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from django.core.cache import cache
from .games.pong import PongGame
from matchs.views import create_match


class	GameManagerConsumer(AsyncWebsocketConsumer):
	matchs = {}

	async def	connect(self):
		self.game_name = self.scope['url_route']['kwargs']['game_name']
		self.game_code = int(self.scope['url_route']['kwargs']['game_code'])
		self.session_id = self.scope['url_route']['kwargs']['session_id']
		self.session_data = await self.get_session_data()
		self.players_max = self.session_data['awaited_players']
		self.game_handler = None
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

		if self.session_data['status'] == 'started':
			self.game_handler = PongHandler(self)
			GameManagerConsumer.matchs[self.session_id] = self.game_handler
			database_sync_to_async(cache.set)(self.session_id, self.session_data)
			await self.game_handler.launch_game(self.session_data['players'])
		else:
			self.loop_task = asyncio.create_task(self.fetch_session_data_loop())
		print(f'\n\n\nusername => |{self.username}|\nuser => |{self.user}|\ncode => |{self.game_code}|\n data => |{self.session_data}|\nscope => |{self.scope}| \n\n')
		await self.send_to_group(self.session_data)

	async def	receive(self, text_data):
		data = json.loads(text_data)
		if self.game_handler is not None:
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
		await self.decrement_connection_count()
		await self.channel_layer.group_discard(
			self.session_id,
			self.channel_name
		)

	async def	fetch_session_data_loop(self):
		print(f"\n\n entrei no loop {self.username} \n\n")
		while True:
			await self.fetch_session_data()
			await asyncio.sleep(0.2)

	async def	fetch_session_data(self):
		if self.session_data['status'] == 'waiting':
			self.session_data = await self.get_session_data()
		else:
			self.game_handler = GameManagerConsumer.matchs.get(self.session_id)
			await self.game_handler.add_consumer(self)
			self.loop_task.cancel()


# TODO
	async def	end_game(self):
		pass

	@database_sync_to_async
	def get_session_data(self):
		return cache.get(self.session_id)

	# @database_sync_to_async
	# def	update_session_status(self):
	# 	# self.session_data['status'] = 'started'
	# 	cache.set(self.session_id, self.session_data)

	@database_sync_to_async
	def change_connection_status(self):
		self.session_data['connected_players'] += 1
		player = self.session_data['players'].get(self.username)
		if player:
			self.session_data['players'][self.username]['connected'] = True
		else:
			self.session_data['players'] = {self.username: {'connected': True, 'id': self.session_data['connected_players']}}
		if self.session_data['connected_players'] == self.session_data['awaited_players']:
			self.session_data['status'] = 'started'
		cache.set(self.session_id, self.session_data)
		

# TODO REFACTO
	# @staticmethod
	# @database_sync_to_async
	async def decrement_connection_count(self):
		session_data = await self.get_session_data()
		# session_data = cache.get(self.session_id)
		session_data['connected_players'] -= 1
		session_data['players'][self.username]['connected'] = False
		if session_data['status'] == 'started':
			# esta no meio do jogo e alguem saiu entao tem que acabar o jogo e criar o match
			other_player = None
			for player in session_data['players']:
				if session_data['players'][player]['connected']:
					print(f'\n\ndecrement => {player} \n\n')
					other_player = player	# make a list for 2 vs 2
			# other_player = [player if  else pass for player in session_data['players']]
			await self.game_handler.end_game(winner=other_player)
			print('\n\nPASSEI AQUI\n\n')
			self.game_handler.remove_consumer(self)
			# await self.channel_layer.group_send(session_data['session_id'], {'type': 'close'}) 
			pass
		if session_data['status'] == 'waiting':
			# ainda nao comecou, so desconectar sem problemas
			pass
		if session_data['status'] == 'finish':
			# pensar em como fazer apos o fim do jogo, replay pode ser complicado
			pass

		# if session_data:
		if session_data['connected_players'] <= 0:
			database_sync_to_async(cache.delete)(self.session_id)
			GameManagerConsumer.matchs.pop(self.session_id)
		else:
			database_sync_to_async(cache.set)(self.session_id, session_data)
		# Decrement the connection count for the session
		# session_data = cache.get(session_id)
		# 	if session_data['connections'] <= 0:
		# 		cache.delete(session_id)
		# 	else:
		# 		cache.set(session_id, session_data)
		pass

class PongHandler():

	def	__init__(self, consumer):
		self.consumer = [consumer]
		# self.consumer_list = [consumer]
		self.game_code = consumer.game_code

	async def	launch_game(self, players_name):
		self.message = self.consumer[0].session_data
		self.game = PongGame(players_name)
		await self.reset_game()
		if 'bot' in self.message['players']:
			# init_bot()
			pass

	async def	add_consumer(self, consumer):
		self.consumer.append(consumer)

	async def	remove_consumer(self, consumer=None):
		# maybe update to 2 vs 2
		if consumer:
			self.consumer.remove(consumer)
		for client in self.consumer:
			client.close()

	async def	reset_game(self):
		self.game.reset_game()
		self.loop_task = asyncio.create_task(self.game_loop())


	async def	receive(self, text_data):
		# print(f'\n\n{self}\n\n')
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
		await self.consumer[0].send_to_group(self.message)
		await self.end_game(game_state)

	async def	cancel_loop(self):
		if hasattr(self, 'loop_task'):
			self.loop_task.cancel()

	async def	end_game(self, gs=None, winner=None):

		if gs is None:
			gs = self.message['game_state']
		if winner is None and gs['player1_score'] != gs['winning_score'] and gs['player2_score'] != gs['winning_score']:
			return
		if winner is None:
			winner = gs['player1_name'] if gs['player2_score'] < gs['player1_score'] else gs['player2_name']	# TODO refacto to 2vs2 and tournament
		if self.game_code != 20: # mode vs 'guest', does not save scores
			match_result = {gs['player1_name']: gs['player1_score'],
					gs['player2_name']: gs['player2_score']}
			print('\n\nPASSEI DENTRO do END_GAME\n\n')
			await sync_to_async(create_match)(match_result, winner)	# TODO refacto to 2vs2 and tournament
		self.message['winner'] = winner
		self.message['status'] = 'finished'
		await database_sync_to_async(cache.set)(self.consumer[0].session_id, self.message)
		await self.cancel_loop()
		await self.consumer[0].send_to_group(self.message)
		# await self.remove_consumer()

		# send notification + restart the game
