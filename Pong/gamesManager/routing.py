from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/game/(?P<game_name>\w+)/(?P<game_code>\d+)/(?P<session_id>\w+)/(?P<token>[\w.=-]+)/$", consumers.GameManagerConsumer.as_asgi()),
]


