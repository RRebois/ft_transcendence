import logging

from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import User
import json


# class UserConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         user = self.scope["user"]
#         logging.debug(f"User is {str(self.scope['user'])}")
#         if user.is_anonymous:
#             await self.close()
#         else:
#             await self.accept()
#
#     async def disconnect(self, close_code):
#         if hasattr(self, 'user') and self.user.is_authenticated:
#             await self.channel_layer.group_discard(f"user_{self.user.id}", self.channel_name)
#
#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         # Handle received messages
#
#     async def send_message(self, event):
#         message = event['message']
#         await self.send(text_data=json.dumps({
#             'message': message
#         }))
#
#     @database_sync_to_async
#     def get_user(self, user_id):
#         try:
#             return User.objects.get(id=user_id)
#         except User.DoesNotExist:
#             return AnonymousUser()

class UserConsumer(WebsocketConsumer):
    def connect(self):
        user = self.scope["user"]
        logging.debug(f"User is {str(self.scope['user'])}")
        if user.is_anonymous:
            self.accept()
            self.close()
        else:
            self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        self.send(text_data=json.dumps({"message": message}))


# class ChatConsumer(WebsocketConsumer):
#     def connect(self):
#         self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
#         self.room_group_name = f"chat_{self.room_name}"
#
#         # Join room group
#         async_to_sync(self.channel_layer.group_add)(
#             self.room_group_name, self.channel_name
#         )
#
#         self.accept()
#
#     def disconnect(self, close_code):
#         # Leave room group
#         async_to_sync(self.channel_layer.group_discard)(
#             self.room_group_name, self.channel_name
#         )
#
#     # Receive message from WebSocket
#     def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         message = text_data_json["message"]
#
#         # Send message to room group
#         async_to_sync(self.channel_layer.group_send)(
#             self.room_group_name, {"type": "chat.message", "message": message}
#         )
#
#     # Receive message from room group
#     def chat_message(self, event):
#         message = event["message"]
#
#         # Send message to WebSocket
#         self.send(text_data=json.dumps({"message": message}))