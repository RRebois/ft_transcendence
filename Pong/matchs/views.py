from django.shortcuts import render
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from django.http import Http404, JsonResponse

from userManagement.models import User, UserData
from .models import *


@method_decorator(csrf_protect, name='dispatch')
class MatchHistoryView(APIView):
    def get(self, request, username, word):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"error": "User does not exists."}, status=404)
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

    for data in players_data:
        if data.get_username() == winner:
            winner_elo = getattr(data, elo)[-1]
            data.user_wins[game] += 1
        else:
            tmp = getattr(data, elo)[-1]
            if tmp > opponent_elo:
                opponent_elo = tmp
            data.user_losses[game] += 1
        data.user_winrate[game] = data.user_wins[game] / (data.user_wins[game] + data.user_losses[game])
        
    for data in players_data:
        elo_lst = getattr(data, elo)
        if data.get_username() == winner:
            new_elo = get_new_elo(elo_lst[-1], opponent_elo, True)
            if new_elo > data.user_highest[game]:
                data.user_highest[game] = new_elo
        else:
            new_elo = get_new_elo(elo_lst[-1], winner_elo, False)
        elo_lst.append(new_elo)
        data.save()


def create_match(match_result, winner, is_pong=True):
    match = Match.objects.create(is_pong=is_pong, count=match_result.length())
    players_data = []

    for player_username in match_result.keys():
        player = User.objects.get(username=player_username)
        players_data.append(UserData.objects.get(user_id=player))
        score = Score.objects.create(
            player=player, 
            match=match, 
            score=match_result[player_username]
            )
        score.save()
        if player_username == winner:
            match.winner = player
        match.players.add(player)
    update_match_data(players_data, winner, is_pong)
    match.save()
