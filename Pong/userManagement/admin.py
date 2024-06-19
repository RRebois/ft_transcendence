from django.contrib import admin
from .models import *


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("pk", "first_name", "last_name",
                    "username", "image")


@admin.register(UserData)
class UserDataAdmin(admin.ModelAdmin):
    list_display = ("get_username", "user_wins", "user_losses",
                    "user_winrate", "user_elo_pong", "user_elo_purrinha")