import json

import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.core.cache import cache
from .game import PongGame
import uuid


class CreateMatchConsumer(AsyncWebsocketConsumer):

#players_nb (1 = local alone) (2 = local + friend) (3 = remote + 1) (4 = remote + 3) 
    async def connect(self):
        self.game_name = self.scope['url_route']['kwargs']['game_name']
        self.players_nb = int(self.scope['url_route']['kwargs']['players_nb'])
        self.user = self.scope['user']
        try:
            self.game_id = self.scope['url_route']['kwargs']['game_id']
        except:
            self.game_id = f"{self.game_name}_{uuid.uuid4()}"

        if self.game_name == 'pong':
            GameConsumer()
        elif self.game_name == 'purrinha':
            GameConsumer()
        else:
            return 'error'

class GameConsumer(AsyncWebsocketConsumer):

#
# recuperar o jogo
# recuperar a quantidade ?talvez local ou remoto pois mesmo local pode ser a dois?
# verificar se existe um id se nao, criar um
# 
# se o jogo ou ?quantidade? incorretos close()
#   se id entrar no jogo 
# dependendo do jogo chama o consumer remoto ou local 
# 
    async def connect(self):
        self.game_name = self.scope['url_route']['kwargs']['game_name']
        self.players_nb = int(self.scope['url_route']['kwargs']['players_nb'])
        # self.user = self.scope['user']

        if self.game_name != 'pong' and self.game_name != 'purrinha':
            await self.close()
            pass
        if self.players_nb < 1 or self.players_nb > 4:
            await self.close()
            pass

        try:
            self.game_id = self.scope['url_route']['kwargs']['game_id']
        except:
            self.game_id = f"{self.game_name}_{uuid.uuid4()}"
            # self.scope['url_route']['kwargs']['game_id'] = self.game_id

        is_existing = await sync_to_async(self.check_session_exists)(self.game_id)
        if not is_existing:
            await sync_to_async(self.create_session)(self.game_id)

        connected_players = await sync_to_async(self.get_connections)(self.game_id)
        if connected_players >= self.players_nb:
            await self.close()
            pass

        await sync_to_async(self.increment_connection_count)(self.game_id)

        await self.channel_layer.group_add(
            self.game_id,
            self.channel_name
        )

        if self.game_name == 'pong':
            self.game = PongGame()
            PongConsumer(self.scope, self.receive, self.game, self.game_id).connect()
        if self.game_name == 'purrinha':
            GameConsumer()


    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.game_id,
            self.channel_name
        )
        await sync_to_async(self.decrement_connection_count)(self.game_id)


    async def receive(self, text_data):
        data = json.loads(text_data)


    @staticmethod
    def check_session_exists(game_id):
        return cache.get(game_id) is not None

    @staticmethod
    def get_connections(game_id):
        session_data = cache.get(game_id)
        return session_data['connections']

    @staticmethod
    def create_session(game_id):
        # Create session state in cache or database
        cache.set(game_id, {'connections': 0, 'winner': None})

    @staticmethod
    def increment_connection_count(game_id):
        # Increment the connection count for the session
        session_data = cache.get(game_id)
        session_data['connections'] += 1
        cache.set(game_id, session_data)

    @staticmethod
    def decrement_connection_count(game_id):
        # Decrement the connection count for the session
        session_data = cache.get(game_id)
        if session_data:
            session_data['connections'] -= 1
            if session_data['connections'] <= 0:
                cache.delete(game_id)
            else:
                cache.set(game_id, session_data)




class PongConsumer(AsyncWebsocketConsumer):
    # game = PongGame()

    async def connect(self, game, game_id):
        self.game = game
        self.session_name = game_id
        self.players_nb = int(self.scope['url_route']['kwargs']['players_nb'])
        await self.accept()
        self.players_count = await sync_to_async(GameConsumer.get_connections)(self.session_name)

        message = {
            'awaited_players': self.players_nb,
            'connected_players': self.players_count,
            'session_id': self.session_name,
            'last_connection': self.channel_name,
            'status': 'waiting'
            }
        if self.players_count == self.players_nb:
            message['status'] = 'success'
            self.loop_task = asyncio.create_task(self.game_loop())
        await self.channel_layer.group_send(self.session_name, {"type": "session.msg", "message": message})


    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.game_id,
            self.channel_name
        )
        await sync_to_async(GameConsumer.decrement_connection_count)(self.session_name)
        if hasattr(self, 'loop_task'):
            self.loop_task.cancel()
            #TODO handle disconnection 

    async def receive(self, text_data):
        data = json.loads(text_data)
        player_move = data.get('player_move')
        if player_move:
            self.game.move_player_paddle(player_move)

    async def game_loop(self):
        await asyncio.sleep(0.2)
        while True:
            await self.send_game_state()
            await asyncio.sleep(0.1)


    async def send_game_state(self):
        self.game.update()
        game_state = self.game.serialize()
        await self.channel_layer.group_send(self.session_name, {"type": "session.msg", "message": game_state})

    async def session_msg(self, event):
        message = event["message"]

        await self.send(text_data=json.dumps({"message": message}))
