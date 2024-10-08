from django.shortcuts import render
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework.exceptions import AuthenticationFailed
from django.contrib import messages
from rest_framework import status
from rest_framework.views import APIView
from django.http import Http404, JsonResponse
from random import choice
from django.core.cache import cache
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


from userManagement.models import User, UserData
from userManagement.views import authenticate_user
from .models import *
from gamesManager.views import MatchMaking
from configFiles.globals import *
from userManagement.utils import gen_timestamp


@method_decorator(csrf_protect, name='dispatch')
class MatchHistoryView(APIView):
    def get(self, request, username, word):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"message": "User does not exists."}, status=404)
        if word == 'all':
            matches = Match.objects.filter(players=user).order_by('-timeMatch')
        elif word == 'pong':
            matches = Match.objects.filter(players=user, is_pong=True).order_by('-timeMatch')
        elif word == 'purrinha':
            matches = Match.objects.filter(players=user, is_pong=False).order_by('-timeMatch')
        else:
            return JsonResponse({"error": "Invalid word."}, status=400)
        return JsonResponse([match.serialize() for match in matches] if matches else [], safe=False, status=200)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class MatchScoreView(APIView):
    def get(self, request, match_id):
        try:
            game = Match.objects.get(pk=match_id)
        except Match.DoesNotExist:
            raise Http404("Error: Match does not exists.")

        return JsonResponse(game.serialize())

@method_decorator(csrf_protect, name='dispatch')
class TournamentDisplayAllView(APIView):
    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"error": "User does not exist."}, status=404)
        tournaments = user.tournaments.all()

        return JsonResponse([tournament.serialize() for tournament in tournaments] if tournaments else [], safe=False, status=200)

@method_decorator(csrf_protect, name='dispatch')
class TournamentDisplayOneView(APIView):
    def get(self, request, tournament_id):
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except:
            return JsonResponse({"error": "Tournament does not exist."}, status=404)

        return JsonResponse(tournament.serialize(), safe=False, status=200)

def get_new_elo(player_elo, opponent_elo, win):

    expected = 1 / (1 + 10 ** ((opponent_elo - player_elo) / 400))

    if player_elo < 1500:
        k = 40
    elif player_elo < 2500:
        k = 20
    else:
        k = 10
    new_elo = player_elo + k * (win - expected)

    return new_elo


def update_match_data(players_data, winner, is_pong=True):
    elo = 'user_elo_pong' if is_pong else 'user_elo_purrinha'
    game = 0 if is_pong else 1
    winner_elo = 0
    opponent_elo = 0
    timestamp = gen_timestamp()

    for data in players_data:
        if data.get_username() in winner:
            tmp = getattr(data, elo)[-1]['elo']
            winner_elo = tmp if tmp > winner_elo else winner_elo
            data.user_wins[game] += 1
        else:
            tmp = getattr(data, elo)[-1]['elo']
            if tmp > opponent_elo:
                opponent_elo = tmp
            data.user_losses[game] += 1

    for data in players_data:
        elo_lst = getattr(data, elo)
        if data.get_username() in winner:
            new_elo = get_new_elo(elo_lst[-1]['elo'], opponent_elo, True)
        else:
            new_elo = get_new_elo(elo_lst[-1]['elo'], winner_elo, False)
        elo_lst.append({'elo': new_elo, 'timestamp': timestamp})
        data.save()

def create_match(match_result, winner, deconnection, is_pong=True):
    match = Match.objects.create(is_pong=is_pong, count=len(match_result), deconnection=deconnection)
    players_data = []

    for player_username in match_result.keys():
        player = User.objects.get(username=player_username)
        players_data.append(player.data)
        score = Score.objects.create(
            player=player,
            match=match,
            score=match_result[player_username]
            )
        score.save()
        if player_username in winner:
            match.winner.add(player)
        match.players.add(player)
    update_match_data(players_data, winner, is_pong)
    match.save()
    return match

def find_tournament_winner(tournament):
    players = {player.username: [0, 0, player] for player in tournament.players.all()}
    matchs = tournament.tournament_matchs.all()
    for match in matchs:
        winner = match.winner.username
        if winner in players:
            players[winner][0] += 1
            players[winner][1] += match.get_winner_score()
    max_wins = max(player[0] for player in players.values())
    players_with_max_win = [player for player in players.values() if player[0] == max_wins]
    if len(players_with_max_win) == 1:
        tournament.winner = players_with_max_win[0][2]
    else:
        max_score = max(player[1] for player in players_with_max_win)
        players_with_max_score = [player for player in players_with_max_win if player[1] == max_score]
        if len(players_with_max_score) == 1:
            tournament.winner = players_with_max_score[0][2]
        else:
            max_elo = max(player[2].data.user_elo_pong[-1]['elo'] for player in players_with_max_win)
            players_with_max_elo = [player for player in players_with_max_score if player[2].data.user_elo_pong[-1]['elo'] == max_elo]
            if len(players_with_max_elo) == 1:
                tournament.winner = players_with_max_elo[0][2]
            else:
                rand_winner = choice(players_with_max_elo)
                tournament.winner = rand_winner[2]
    tournament.is_finished = True
    tournament.save()
    MatchMaking.delete_tournament_session(tournament.get_id())


def add_match_to_tournament(tournament_id, match):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
    except:
        return JsonResponse({"error": "Tournament does not exist."}, status=404)
    unfinished_matchs = tournament.get_unfinished_matchs()
    for unfinished_match in unfinished_matchs:
        unfinished_match.match = match
        unfinished_match.score = [score.score for score in match.scores.all()]
        unfinished_match.save()
        break
    if len(unfinished_matchs) <= 1:
        find_tournament_winner(tournament)


def send_to_tournament_group(tournament_id):
    cache_db = cache.get(tournament_id)
    if not cache_db:
        return
    channel_layer = get_channel_layer()
    for channel in cache_db['channels']:
        async_to_sync(channel_layer.group_send)(
            channel,
            {
                'type': 'tournament_update',
                'players': cache_db['players'],
                'matchs': cache_db['matchs'],
                'message': cache_db['message'],
            }
    )

def add_player_to_tournament(user, tournament):
    tournament_id = tournament.get_id()
    cache_db = cache.get(tournament_id)
    if not cache_db:
        cache_db = {
            'channels': [],
            'players': [],
            'matchs': [],
            # 'live_matchs': [],
            'message': 'waiting for other players',

        }
    count = tournament.players.count()
    players = tournament.players.all()
    for player in players:
        TournamentMatch.objects.create(tournament=tournament)
    tournament.players.add(user)
    cache_db['players'].append(user.username)
    cache_db['channels'].append(f"user_{user.id}_group")
    for player in cache_db['players']:
        cache_db['matchs'].append({user.username: 0, player: 0, 'status': 'waiting'})
    if count + 1 == TOURNAMENT_LIMIT:
        cache_db['message'] = 'The tournament is ready to start, you can play now.'
        tournament.is_closed = True
    tournament.save()
    cache.set(
        tournament_id,
        cache_db,
    )
    send_to_tournament_group(tournament_id)


@method_decorator(csrf_protect, name='dispatch')
class   CreateTournamentView(APIView):

    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        tournament = Tournament.objects.create()
        add_player_to_tournament(user, tournament)
        return JsonResponse(data={"tournament_id": tournament.get_id()}, status=200)


@method_decorator(csrf_protect, name='dispatch')
class   JoinTournamentView(APIView):

    def get(self, request, tournament_id):

        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except:
            return JsonResponse(data={"error": "Tournament does not exist."}, status=404)
        if tournament.winner:
            return JsonResponse(data={"error": "Tournament is already finished."}, status=404)
        if user in tournament.players.all():
            return JsonResponse(data={"error": "You have already joined this tournament."}, status=404)
        if tournament.is_closed:
            return JsonResponse(data={"error": "Tournament is already full."}, status=404)
        add_player_to_tournament(user, tournament)


@method_decorator(csrf_protect, name='dispatch')
class   PlayTournamentView(APIView):

    def get(self, request, tournament_id):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except:
            return JsonResponse({"error": "Tournament does not exist."}, status=404)
        if tournament.is_finished:
            return JsonResponse({"error": "This tournament is already finished."}, status=404)
        if not tournament.is_closed:
            return JsonResponse({"error": "This tournament is not ready to play. Wait for all players."}, status=404)
        if user not in tournament.players.all():
            return JsonResponse({"error": "You have not joined this tournament."}, status=404)
        session_id = MatchMaking.get_tournament_match(tournament_id) # verify if it returned a json

        return JsonResponse({
			'game': 'pong',
			'session_id': session_id,
			'ws_route': f'/ws/game/pong/23/{session_id}/'
		}, status=status.HTTP_200_OK)
