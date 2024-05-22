from django.shortcuts import render
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse

from .models import *
from .forms import *


def index(request):
    if request.user.is_authenticated:
        return render(request, "index.html", {
            "username": request.user.username,
        })
    return render(request, "index.html")

def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        print(user)

        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "index.html", {
                "login_error": "Invalid username and/or password."
            })

    return render(request, "login.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))
def register_view(request):
    if request.method == "POST":
        form = userRegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            user = form.instance
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "register.html", {
                "form": form,
            })
    else:
        return render(request, "register.html", {
            "form": userRegistrationForm,
        })

@csrf_exempt
def userStatsData(request, username):
    # Query for requested post
    try:
        user = userData.objects.get(username=username)
    except userData.DoesNotExist:
        return JsonResponse({"error": "User does not exists"}, status=404)

    if request.method == "GET":
        return JsonResponse(user.serialize())
    else:
        return JsonResponse({"Error": "Method not allowed"})