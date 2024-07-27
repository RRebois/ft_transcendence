import logging

from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import User
import json


class UserConsumer(WebsocketConsumer):
    def connect(self):
        user = self.scope["user"]
        logging.debug(f"User is {str(self.scope['user'])}")
        if user.is_anonymous:
            self.accept()
            self.close()
        else:
            async_to_sync(self.channel_layer.group_add(f"user_{user.id}_group", self.channel_name))
            self.accept()

    def disconnect(self, close_code):
        user = self.scope['user']
        async_to_sync(self.channel_layer.group_discard(f"user_{user.id}_group", self.channel_name))
        pass

    def receive(self, text_data):
        pass
