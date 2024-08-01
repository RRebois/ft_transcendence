import json

import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .game import PongGame  


class PongConsumer(AsyncWebsocketConsumer):
    game = PongGame()

    async def connect(self):
        print('passei aqui')
        await self.accept()
        self.loop_task = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        self.loop_task.cancel()

    async def receive(self, text_data):
        data = json.loads(text_data)
        player_move = data.get('player_move')
        if player_move:
            self.game.move_player_paddle(player_move)
        # await self.send_game_state()

    async def game_loop(self):
        while True:
            # await self.game.update()
            await self.send_game_state()
            await asyncio.sleep(0.1)


    async def send_game_state(self):
        self.game.update()
        game_state = self.game.serialize()
        await self.send(text_data=json.dumps(game_state))
