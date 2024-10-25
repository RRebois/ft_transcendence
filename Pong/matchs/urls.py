from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path("matches/<str:username>:<str:word>", MatchHistoryView.as_view(), name="matchHistory"),
    path("match/<int:match_id>", MatchScoreView.as_view(), name="matchScore"),
    path("match/<str:session_id>", MatchExistsView.as_view(), name="matchExists"),
    path("tournament/create", CreateTournamentView.as_view(), name="createTournament"),
    path("tournament/join/<str:tournament_name>", JoinTournamentView.as_view(), name="joinTournament"),
    path("tournament/play/<str:tournament_name>", PlayTournamentView.as_view(), name="playTournament"),
    path("tournament/history/open", TournamentDisplayOpenView.as_view(), name="tournamentOpen"),
    path("tournament/history/all", TournamentDisplayAllView.as_view(), name="tournamentHistory"),
    path("tournament/history/<str:username>", TournamentDisplayAllUserView.as_view(), name="tournamentUserHistory"),
    path("tournament/display/<str:tournament_name>", TournamentDisplayOneView.as_view(), name="tournamentDisplay"),
]
