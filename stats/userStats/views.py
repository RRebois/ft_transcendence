from django.shortcuts import render, redirect
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from django.db import IntegrityError
from django.contrib import messages
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

        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "login.html", {
                "message": "Invalid username and/or password."
            })

    return render(request, "login.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))
def register_view(request):
    if request.method == "POST":
        form = UserRegistrationForm(request.POST)
        print(form.errors)
        if form.is_valid():
            user = form.save()
            # user = request.POST["username"]
            # # user = form.clean_username()
            # # password = form.clean_passwords()
            # email = request.POST["email"]
            # password = request.POST["password"]
        # else:
        #     form = UserRegistrationForm()
        #     return render(request, "register.html", {
        #         "message": "bad input",
        #         "form": form
        #     })

            messages.success(request, "You have successfully registered.")
            login(request, user)
            return redirect(reverse("index"))
            # return HttpResponseRedirect(reverse("index"))
        # else:
        #     return render(request, "register.html")
            # form = UserRegistrationForm()
            # return render(request, "register.html", {
            #     "form": form,
            # })
        else:
            form = UserRegistrationForm()
        return render(request, "register.html", {
            "form": form
        })
    else:
        form = UserRegistrationForm()
        return render(request, "register.html", {
            "form": form
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