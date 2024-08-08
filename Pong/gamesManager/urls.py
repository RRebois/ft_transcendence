from django.urls import path, include
from . import views
from .views import *

urlpatterns = [
    path("<str:game_name>/<int:num_players>/", views.game_manager, name="game_manager"),
    path("<str:game_name>/<int:num_players>/<str:session_id>", views.game_manager, name="game_manager"),
]

