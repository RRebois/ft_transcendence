from django.shortcuts import render
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from django.http import Http404, JsonResponse

from userManagement.models import User
from .models import *


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class MatchHistoryView(APIView):
    def get(self, request, username):
        try:
            matchs = Match.objects.filter(players=User.objects.get(username=username))
        except User.DoesNotExist:
            raise Http404("error: User does not exists.")
        except Match.DoesNotExist:
            raise Http404("error: User data does not exists.")

        return JsonResponse([match.serialize() for match in matchs], safe=False)
