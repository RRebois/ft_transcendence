from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path("", AnotherGameView.as_view(), name="another_game"),
]
