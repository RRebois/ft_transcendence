from django.shortcuts import render
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from django.http import Http404, JsonResponse

from userManagement.models import User, UserData
from .models import *


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class MatchHistoryView(APIView):
    def get(self, request, username):
        try:
            matchs = Match.objects.filter(players=User.objects.get(username=username))
        except User.DoesNotExist:
            raise Http404("error: User does not exists.")

        return JsonResponse([match.serialize() for match in matchs], safe=False)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class MatchScoreView(APIView):
    def get(selfself, request, match_id):
        try:
            game = Match.objects.get(pk=match_id)
        except Match.DoesNotExist:
            raise Http404("Error: Match does not exists.")

        return JsonResponse(game.serialize())


def create_match(match_result, winner, is_pong=True):
    match = Match.objects.create(is_pong=is_pong)
    game = 0 if is_pong else 1

    for player_username in match_result.keys():
        player = User.objects.get(username=player_username)
        user_data = UserData.objects.get(user_id=player)
        score = PlayerScore.objects.update_or_create(
            player=player, 
            match=match, 
            create_defaults={'score' : match_result[player_username]}
            )
        score[0].save()
        if player_username == winner:
            match.winner = player
            user_data.user_wins[game] += 1
        else:
            user_data.user_losses[game] += 1
        user_data.user_winrate[game] = user_data.user_wins[game] / (user_data.user_wins[game] + user_data.user_losses[game])
        user_data.save()
        match.players.add(player)
    match.save()