import logging

from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
import json

from .models import User


class UserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        logging.debug(f"User is {str(self.scope['user'])}")
        if user.is_anonymous:
            await self.accept()
            await self.close()
        else:
            await self.user_online(user)
            await self.channel_layer.group_add(f"user_{user.id}_group", self.channel_name)
            await self.channel_layer.group_add("Connected_users_group", self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        user = self.scope['user']
        await self.user_offline(user)
        await self.channel_layer.group_discard(f"user_{user.id}_group", self.channel_name)
        await self.channel_layer.group_discard("Connected_users_group", self.channel_name)
        logging.debug(f"User {str(self.scope['user'])} disconnected")
        pass

    async def receive(self, text_data):
        pass

    @database_sync_to_async
    def user_online(self, user):
        try:
            user_connected = User.objects.get(user=user)
            user_connected.status = "online"
            user_connected.save()
        except:
            return

    @database_sync_to_async
    def user_offline(self, user):
        try:
            user_connected = User.objects.get(user=user)
            user_connected.status = "offline"
            user_connected.save()
        except:
            return

