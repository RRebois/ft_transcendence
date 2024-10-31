from django.urls import re_path
from gamesManager.consumers import GameManagerConsumer
from userManagement.consumers import UserConsumer
from cli.consumers import TerminalConsumer

websocket_urlpatterns = [
        re_path(r"ws/game/(?P<game_name>\w+)/(?P<game_code>\d+)/(?P<session_id>\w+)/(?P<token>[\w.=-]+)/$", GameManagerConsumer.as_asgi()),
        re_path(r"ws/user/(?P<token>[\w.=-]+)/$", UserConsumer.as_asgi()),
        re_path(r"ws/api/$", TerminalConsumer.as_asgi()),
]
