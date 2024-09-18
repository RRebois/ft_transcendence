from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path("matches/<str:username>:<str:word>", MatchHistoryView.as_view(), name="matchHistory"),
    path("match/<int:match_id>", MatchScoreView.as_view(), name="matchScore"),
    path("tounament/create/", CreateTournamentView.as_view(), name="createTournament"),
    path("tounament/join/<str:tournament_id>", JoinTournamentView.as_view(), name="joinTournament"),
    path("tounament/play/<str:tournament_id>", PlayTournamentView.as_view(), name="playTournament"),
    path("tounament/history/<str:username>", TournamentDisplayAllView.as_view(), name="tournamentHistory"),
    path("tounament/display/<str:tournament_id>", TournamentDisplayOneView.as_view(), name="tournamentDisplay"),
]
