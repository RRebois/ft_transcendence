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
            logging.debug(f"User {str(self.scope['user'])} is now {user_connected.status}")
            return True
        except:
            return False

    async def user_online(self, user):
        update = await self.update_user_status(user, "online")
        if update:
            await self.channel_layer.group_send(
                "Connected_users_group",
                {
                    "type": "status_change",
                    "user_id": user.id,
                    "status": "online"
                }
            )
        else:
            return

    async def user_offline(self, user):
        update = await self.update_user_status(user, "offline")
        if update:
            await self.channel_layer.group_send(
                "Connected_users_group",
                {
                    "type": "status_change",
                    "user_id": user.id,
                    "status": "offline"
                }
            )
        else:
            return

    async def connect(self):
        user = self.scope["user"]
        logging.debug(f"WS User is {str(self.scope['user'])}")
        if user.is_anonymous:
            await self.accept()
            await self.close()
        else:
            await self.accept()
            await self.channel_layer.group_add(f"user_{user.id}_group", self.channel_name)
            await self.channel_layer.group_add("Connected_users_group", self.channel_name)
            await self.user_online(user)
            await self.send(text_data=json.dumps({
                'type': 'test_message',
                'message': 'Hello from server!'
            }))

    async def disconnect(self, close_code):
        user = self.scope['user']
        await self.user_offline(user)
        await self.channel_layer.group_discard(f"user_{user.id}_group", self.channel_name)
        await self.channel_layer.group_discard("Connected_users_group", self.channel_name)
        await self.send(text_data=json.dumps({
            'type': 'test_message',
            'message': 'Goodbye from server!'
        }))

    async def receive(self, text_data):
        print(f"Received message: {text_data}")
        pass

    async def status_change(self, event):
        await self.send(text_data=json.dumps({
            'type': 'status_change',
            'user_id': event['user_id'],
            'status': event['status']
        }))

    async def friend_request(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_request',
            'from_user': event['from_user'],
            'from_user_id': event['from_user_id'],
            'from_image_url': event['from_image_url'],
            'to_image_url': event['to_image_url'],
            'to_user': event['to_user'],
            'time': event['time'],
            'request_status': event['request_status']
        }))

    async def friend_req_accept(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_req_accept',
            'from_user': event['from_user'],
            'from_user_id': event['from_user_id'],
            'from_status': event['from_status'],
            'from_image_url': event['from_image_url'],
            'to_image_url': event['to_image_url'],
            'to_user': event['to_user'],
            'to_status': event['to_status'],
            'time': event['time'],
            'request_status': event['request_status'],
        }))

    async def friend_remove(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_remove',
            'from_user': event['from_user'],
            'from_user_id': event['from_user_id'],
            # 'from_image_url': event['from_image_url'],
            # 'to_image_url': event['to_image_url'],
            # 'to_user': event['to_user'],
            # # 'time': event['time'],
        }))

    async def friend_delete_acc(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_delete_acc',
            'from_user': event['from_user'],
            'from_user_id': event['from_user_id'],
            # 'from_image_url': event['from_image_url'],
            # 'to_image_url': event['to_image_url'],
            # 'to_user': event['to_user'],
        }))

    async def friend_data_edit(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_data_edit',
            'from_user': event['from_user'],
            'from_user_id': event['from_user_id'],
            'from_image_url': event['from_image_url'],
        }))
