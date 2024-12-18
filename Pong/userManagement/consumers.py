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
            self.scope['user'] = user_connected
            return True
        except:
            return False

    async def user_online(self):
        user = self.scope['user']
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

    async def user_offline(self):
        user = self.scope['user']
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

    async def user_in_game(self):
        user = self.scope['user']
        update = await self.update_user_status(user, "in-game")
        if update:
            await self.channel_layer.group_send(
                "Connected_users_group",
                {
                    "type": "status_change",
                    "user_id": user.id,
                    "status": "in-game",
                }
            )
        else:
            return

    @database_sync_to_async
    def ws_count(self, nb):
        try:
            user = User.objects.get(id=self.scope['user'].id)
            user.active_ws += nb
            user.save(update_fields=['active_ws'])
            self.scope['user'] = user
        except:
            return
        return

    async def connect_active_ws(self, user):
        await self.ws_count(1)
        if self.scope['user'].active_ws == 1:
            await self.user_online()
        return

    async def disconnect_active_ws(self, user):
        await self.ws_count(-1)
        if self.scope['user'].active_ws == 0:
            await self.user_offline()
        return

    async def connect(self):
        user = self.scope['user']
        if user.is_anonymous:
            await self.accept()
            await self.close()
        else:
            await self.accept()
            await self.channel_layer.group_add(f"user_{user.id}_group", self.channel_name)
            await self.channel_layer.group_add("Connected_users_group", self.channel_name)
            await self.connect_active_ws(user)

    async def disconnect(self, close_code):
        user = self.scope['user']
        await self.disconnect_active_ws(user)
        await self.channel_layer.group_discard(f"user_{user.id}_group", self.channel_name)
        await self.channel_layer.group_discard("Connected_users_group", self.channel_name)

    async def receive(self, text_data):
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
            'from_user_status': event['from_user_status'],
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
            'to_user_id': event['to_user_id'],
            'to_status': event['to_status'],
            'time': event['time'],
            'request_status': event['request_status'],
            'size': event['size'],
        }))

    async def friend_req_decline(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_req_decline',
            'from_user': event['from_user'],
            'from_user_id': event['from_user_id'],
            'to_user': event['to_user'],
            'to_user_id': event['to_user_id'],
            'request_status': event['request_status'],
            'size': event['size'],
        }))

    async def friend_remove(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_remove',
            'from_user': event['from_user'],
            'from_user_id': event['from_user_id'],
            'from_image_url': event['from_image_url'],
            'to_image_url': event['to_image_url'],
            'to_user': event['to_user'],
            'to_user_id': event['to_user_id'],
        }))

    async def friend_delete_acc(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_delete_acc',
            'from_user': event['from_user'],
            'from_user_id': event['from_user_id'],
        }))

    async def friend_data_edit(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_data_edit',
            'from_user': event['from_user'],
            'from_user_id': event['from_user_id'],
            'from_image_url': event['from_image_url'],
        }))

    async def tournament_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'tournament_update',
            'players': event['players'],
            'matchs': event['matchs'],
            'message': event['message'],
        }))

    async def tournament_full(self, event):
        await self.send(text_data=json.dumps({
            'type': 'tournament_full',
            'players': event['players'],
            'message': event['message'],
        }))

    async def join_match(self, event):
        user = self.scope['user']
        await self.send(text_data=json.dumps({
            'type': 'join_match',
            'user_id': user.id,
            'status': 'offline'
        }))

    async def tournament_created(self, event):
        await self.send(text_data=json.dumps({
            'type': 'tournament_created',
            'message': event['message'],
            'creator': event['creator'],
            'tournament_name': event['tournament_name'],
            'tournament_closed': event['tournament_closed'],
            'tournament_finished': event['tournament_finished'],
        }))

    async def tournament_new_player(self, event):
        await self.send(text_data=json.dumps({
            'type': 'tournament_new_player',
            'tournament_name': event['tournament_name'],
            'players': event['players'],
            'matchs': event['matchs'],
        }))

    async def tournament_play(self, event):
        await self.send(text_data=json.dumps({
            'type': 'tournament_play',
            'message': event['message'],
            'player': event['player'],
        }))

