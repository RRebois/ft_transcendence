from django.contrib import admin
from .models import *


@admin.register(Avatars)
class AvatarsAdmin(admin.ModelAdmin):
    list_display = ("pk", "image")


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("pk", "first_name", "last_name",
                    "username", "get_img_url")


@admin.register(FriendRequest)
class FriendRequest(admin.ModelAdmin):
    list_display = ("get_to_user", "id")


@admin.register(UserData)
class UserDataAdmin(admin.ModelAdmin):
    list_display = ("get_username", "user_wins", "user_losses",
                    "user_winrate", "user_elo_pong", "user_elo_purrinha")
