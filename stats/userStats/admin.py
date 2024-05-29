from django.contrib import admin
from .models import *


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("pk", "first_name", "last_name",
                    "username", "image")


@admin.register(UserData)
class UserDataAdmin(admin.ModelAdmin):
    list_display = ("pk", "user_wins", "user_losses",
                    "user_winrate", "user_elo")
