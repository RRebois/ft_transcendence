from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/game/(?P<game_name>\w+)/(?P<players_nb>\d+)/(?P<session_id>\w+)/$", consumers.GameManagerConsumer.as_asgi()),
]


