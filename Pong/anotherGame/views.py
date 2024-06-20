from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from random import randint
import json

from userManagement.models import User, UserData
from userManagement.views import authenticate_user
from matchs.views import create_match
from .game import *

@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class   AnotherGameView(APIView):
    match = PurrinhaGame()
    
    def update_results(self, result):

        match_result = {}
        for player in result['players']:
            match_result[player] = 1 if player == result else 0
        create_match(match_result=match_result, winner=result['winner'], is_pong=False)

    def post(self, request):
        user = authenticate_user(request)
        username = user.username
        data = json.loads(request.body)

        if 'quantity' in data:
            bot = 'bot-purrinha'
            quantity = 1
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
        bot = User.objects.get_or_create(username='bot-purrinha')
        UserData.objects.get_or_create(user_id=bot[0])
        AnotherGameView.match.remove_players()
        return render(request, "pages/test.html")