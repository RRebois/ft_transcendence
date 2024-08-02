from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/game/(?P<game_name>\w+)/(?P<players_nb>\d+)/(?P<game_id>\w+)/$", consumers.GameConsumer.as_asgi()),
    re_path(r"ws/game/(?P<game_name>\w+)/(?P<players_nb>\d+)/$", consumers.GameConsumer.as_asgi()),
    re_path(r"ws/pong/$", consumers.PongConsumer.as_asgi()),
]