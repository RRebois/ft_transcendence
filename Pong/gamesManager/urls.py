from django.urls import path, include
from . import views
from .views import *

urlpatterns = [
    path("<str:game_name>/<int:num_players>/", views.pong, name="pong"),
    path("<str:game_name>/<int:num_players>/<str:session_id>", views.pong, name="pong"),
]

