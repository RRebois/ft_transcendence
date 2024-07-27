import logging

from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
import json


class UserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        logging.debug(f"User is {str(self.scope['user'])}")
        if user.is_anonymous:
            await self.accept()
            await self.close()
        else:
            await self.channel_layer.group_add(f"user_{user.id}_group", self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        user = self.scope['user']
        await self.channel_layer.group_discard(f"user_{user.id}_group", self.channel_name)
        pass

    async def receive(self, text_data):
        pass
