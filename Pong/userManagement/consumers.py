import logging

from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from .models import User
import json


class UserConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def update_user_status(self, user, status):
        try:
            user_connected = User.objects.get(id=user.id)
            user_connected.status = status
            user_connected.save(update_fields=['status'])
            return True
        except:
            logging.debug(f"IN update EXCEPT")
            return False

    async def user_online(self, user):
        logging.debug(f"IN ONLINE")
        update = await self.update_user_status(user, "online")
        if update:
            logging.debug("IN UPDATE")
            self.channel_layer.group_send(
                "Connected_users_group",
                {
                    "type": "status_change",
                    "user_id": user.id,
                    "status": "online"
                }
            )
        else:
            logging.debug(f"IN ELSE")
            return

    async def user_offline(self, user):
        logging.debug(f"IN OFFLINE")
        update = await self.update_user_status(user, "offline")
        if update:
            self.channel_layer.group_send(
                "Connected_users_group",
                {
                    "type": "status_change",
                    "user_id": user.id,
                    "status": "offline"
                }
            )
        else:
            logging.debug(f"IN EXCEPT")
            return

    async def connect(self):
        user = self.scope["user"]
        if user.is_anonymous:
            await self.accept()
            await self.close()
        else:
            await self.accept()
            await self.channel_layer.group_add(f"user_{user.id}_group", self.channel_name)
            await self.channel_layer.group_add("Connected_users_group", self.channel_name)
            await self.user_online(user)
            logging.debug(f"Connected: User {str(self.scope['user'])} is now {user.status}")
            await self.send(text_data=json.dumps({
                'type': 'test_message',
                'message': 'Hello from server!'
            }))

    async def disconnect(self, close_code):
        user = self.scope['user']
        await self.user_offline(user)
        await self.channel_layer.group_discard(f"user_{user.id}_group", self.channel_name)
        await self.channel_layer.group_discard("Connected_users_group", self.channel_name)
        logging.debug(f"Disconnected: User {str(self.scope['user'])} is now {user.status}")

    async def receive(self, text_data):
        print(f"Received message: {text_data}")
        pass

    async def status_change(self, event):
        logging.debug(f"$$$ Received status change event: {event}")
        await self.send(text_data=json.dumps({
            'type': 'status_change',
            'user_id': event['user_id'],
            'status': event['status']
        }))
