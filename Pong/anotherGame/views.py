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

from .game import *

# @method_decorator(csrf_protect, name='dispatch')
# @method_decorator(login_required(login_url='login'), name='dispatch')
class   AnotherGameView(APIView):

    def launch_match(self, entries):
        if len(entries) < 2:
            return False
        match = PurrinhaGame(entries)
        return match

    #     return websocket = 0

    def post(self, request):
        usernames = request.POST.getlist('username[]')
        quantity = request.POST.getlist('quantity[]')
        guess = request.POST.getlist('guess[]')

        entries = []
        for username, quantity, guess in zip(usernames, quantity, guess):
            entries.append({
                'username': username,
                'quantity': quantity,
                'guess': guess
            })
        match = self.launch_match(entries)
        result = match.launch_round()
        response = render(request, "pages/test.html")
        messages.error(request, result)
        # if result['winner'] != "tie":
        #     messages.info(request, f"The winner is ${result['winner']}!")
        # else:
        #     messages.info(request, "No one guessed the right answer...")
        return response
        # return JsonResponse({"result" : result})

    def get(self, request):
        return render(request, "pages/test.html")