from django.urls import path, include
from . import views
from .views import *

urlpatterns = [
    path("", views.pong, name="pong"),
]

