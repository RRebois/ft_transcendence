from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path("matchs/<str:username>", MatchHistoryView.as_view(), name="matchHistory"),
    path("match/<int:match_id>", MatchScoreView.as_view(), name="matchScore"),
]