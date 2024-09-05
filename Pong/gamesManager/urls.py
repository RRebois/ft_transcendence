from django.urls import path, include
from . import views
from .views import *

urlpatterns = [
    path("<str:game_name>/<int:game_code>/", GameManagerView.as_view(), name="game_manager"),
    # path("<str:game_name>/<int:game_code>/<str:session_id>", GameManagerView.as_view(), name="game_manager"),
]
