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
    matchs = []
    
    def update_results(self, result):
        match_result = {}
        for player in result['players']:
            match_result[player] = 1 if player == result['winner'] else 0
        create_match(match_result=match_result, winner=result['winner'], is_pong=False)

    def get_match(self, id=False):
        for match in AnotherGameView.matchs:
            if match.game_id == id:
                return match
        match = PurrinhaGame()
        AnotherGameView.matchs.append(match)
        return match
         

    def post(self, request):
        # form = PurrinhaForm(request.POST)
        # if form.is_valid():
            user = authenticate_user(request)
            username = user.username
            data = json.loads(request.body)
            match = self.get_match(data.get('game_id'))

            if 'quantity' in data:
                bot = 'bot-purrinha'
                quantity = 1
                guess = quantity + randint(0, 3)
                match.add_player(bot)
                match.add_player(username)
                match.set_player_quantity(bot, quantity)
                match.set_player_guess(bot, guess)
                match.set_player_quantity(username, data['quantity'])
                return JsonResponse({'status': 'success', 'bot_quantity' : quantity, 'bot_guess' : guess, 'game_id' : match.game_id})
            elif 'guess' in data:
                match.set_player_guess(username, data['guess'])
                result = match.get_round_result()
                if result['winner'] != 'tie':
                    self.update_results(result)
                result.pop('players')
                AnotherGameView.matchs.remove(match)
                return JsonResponse(result)

    def get(self, request):
        bot = User.objects.get_or_create(username='bot-purrinha')
        UserData.objects.get_or_create(user_id=bot[0])
        return render(request, "pages/test.html", {
            'form' : PurrinhaForm(),
        })