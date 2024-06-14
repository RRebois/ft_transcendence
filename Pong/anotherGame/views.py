from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import Http404, HttpResponse, HttpResponseRedirect, JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.urls import reverse
from rest_framework.views import APIView
from rest_framework.response import Response
import requests
from random import randint
import json

from userManagement.models import User, UserData
from userManagement.views import authenticate_user
# from .serializer import AnotherGameSerializer
from .game import *

# @method_decorator(csrf_protect, name='dispatch')
# @method_decorator(login_required(login_url='login'), name='dispatch')
class   AnotherGameView(APIView):

    def __init__(self):
        self.match = PurrinhaGame()
        # self.user = authenticate_user(request)
        self.username = "____empty____"
        # self.match.add_player(self.username)

    # serializer_class = AnotherGameSerializer
    # def create_game(self, username):
    #     match = PurrinhaGame()
    #     match.add_player(username)
    #     return match


    def post(self, request):
        if self.username == "____empty____":
            user = authenticate_user(request)
        # messages.error(request, user, safe=False)
        # return render(request, "pages/test.html")
        # serializer = self.serializer_class(user)
            self.username = user.username
        # match = self.create_game(username)
            self.match.add_player(self.username)
        # data = request.GET.get('quantity')
        data = json.loads(request.body)

        if 'quantity' in data:
            bot = 'bot'
            quantity = 1
            guess = quantity + randint(0, 3)
            self.match.add_player(bot)
            self.match.set_player_quantity(bot, quantity)
            self.match.set_player_guess(bot, guess)
            self.match.set_player_quantity(self.username, data['quantity'])
            # messages.warning(request, f"The bot bets there are {guess} in total.")
            # quantity = data['quantity']
            # Salvar quantity para o usuário
            # user.profile.quantity = quantity
            # user.profile.save()
            return JsonResponse({'status': 'success', 'bot_quantity' : self.match.get_player_quantity(bot), 'bot_guess' : guess})
        elif 'guess' in data:
            self.match.set_player_guess(self.username, data['guess'])
            user_data = UserData.objects.get(user_id=User.objects.get(username=self.username))
            # guess = data['guess']
            # Salvar guess para o usuário
            # user.profile.guess = guess
            # user.profile.save()
            result = self.match.launch_round()
            # messages.error(request, match.players)
            if result['winner'] == self.username:
                user_data.user_wins += 1
                user_data.save()
            elif result['winner'] == 'bot':
                user_data.user_losses += 1
                user_data.save()
            result['guess'] = data['guess']
            result['username'] = self.username
            # result["fora_bot_guess"] = self.match.get_player_guess('bot')
            # result["fora_bot_quantity"] = self.match.get_player_quantity('bot')
            # result["fora_username_quantity"] = self.match.get_player_quantity(self.username)
            # result["fora_username_guess"] = self.match.get_player_guess(self.username)
            return JsonResponse(result)

        # usernames = request.POST.getlist('username[]')
        # quantity = request.POST.getlist('quantity[]')
        # guess = request.POST.getlist('guess[]')

        # entries = []
        # for username, quantity, guess in zip(usernames, quantity, guess):
        #     entries.append({
        #         'username': username,
        #         'quantity': quantity,
        #         'guess': guess
        #     })
        # match = self.launch_match(entries)



        # result = match.launch_round()
        # response = render(request, "pages/test.html")
        # # messages.error(request, match.players)
        # if result['winner'] == "tie":
        #     messages.info(request, "No one guessed the right answer...")
        # elif result['winner'] == username:
        #     messages.info(request, "You won! Congratulations ")
        #     user_data.user_wins += 1
        #     user_data.save()
        # else:
        #     messages.info(request, "You lost!")
        #     user_data.user_losses += 1
        #     user_data.save()
        # return response
    

        # return JsonResponse({"result" : result})

    def get(self, request):
        return render(request, "pages/test.html")
        # return self.post(request)
        # user = request.user
        # serializer = self.serializer_class(user)