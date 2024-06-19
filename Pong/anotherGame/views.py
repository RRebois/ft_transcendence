from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import Http404, HttpResponse, HttpResponseRedirect, JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.urls import reverse
from rest_framework.views import APIView
from rest_framework.response import Response
from random import randint
import requests
import json

from userManagement.models import User, UserData
from userManagement.views import authenticate_user
# from matchs.manager import MatchManager
from matchs.models import Match
from .game import *

@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class   AnotherGameView(APIView):
    match = PurrinhaGame()
    # manager = MatchManager
    
    def update_results(self, result):
        # winner = result['winner'] if result['winner'] != 'tie' else None
        # if 'bot' in result['players']:
        #     result['players'].remove('bot')
        # creator = self.manager()
        score = [0, 1]
        match = Match.objects.create(game=False, score=score)
        # match.game = False
        # match.score = score
        for player_username in result['players']:
            player = User.objects.get(username=player_username)
            if player_username == result['winner']:
                match.winner = player
            match.players.add(player)
        match.save()
        # creator.create_match(players=result['players'], winner=winner, is_pong=False, score=score)
        # return test.serialize()
        # if winner:
        for player in result['players']:
            # if player != 'bot':
            user_data = UserData.objects.get(user_id=User.objects.get(username=player))
            if result['winner'] == player:
                user_data.user_wins[1] += 1
            else:
                user_data.user_losses[1] += 1
            user_data.user_winrate[1] = user_data.user_wins[1] / (user_data.user_wins[1] + user_data.user_losses[1])
            user_data.save()

    def post(self, request):
        user = authenticate_user(request)
        username = user.username
        data = json.loads(request.body)

        if 'quantity' in data:
            bot = 'bot-purrinha'
            quantity = randint(0, 3)
            guess = quantity + randint(0, 3)
            AnotherGameView.match.add_player(bot)
            AnotherGameView.match.add_player(username)
            AnotherGameView.match.set_player_quantity(bot, quantity)
            AnotherGameView.match.set_player_guess(bot, guess)
            AnotherGameView.match.set_player_quantity(username, data['quantity'])
            return JsonResponse({'status': 'success', 'bot_quantity' : quantity, 'bot_guess' : guess})
        elif 'guess' in data:
            AnotherGameView.match.set_player_guess(username, data['guess'])
            result = AnotherGameView.match.get_round_result()
            if result['winner'] != 'tie':
                self.update_results(result)
            result.pop('players')
            AnotherGameView.match.remove_players()
            return JsonResponse(result)

    def get(self, request):
        AnotherGameView.match.remove_players()
        return render(request, "pages/test.html")