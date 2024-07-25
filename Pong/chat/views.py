from django.shortcuts import render

def index(request):
    return render(request, "pages/chat_index.html")

def room(request, room_name):
    return render(request, "pages/chat_room.html", {"room_name": room_name})