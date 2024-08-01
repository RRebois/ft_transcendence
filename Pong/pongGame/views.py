from django.shortcuts import render

def pong(request):
    return render(request, "pages/pong.html")
