from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path("", index, name="chat_index"),
    path("<str:room_name>/", room, name="room"),
]
