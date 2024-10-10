from django.contrib import admin
from .models import *


@admin.register(Avatars)
class AvatarsAdmin(admin.ModelAdmin):
    def get_uploaders(self, obj):
        return ", ".join([user.username for user in obj.uploaded_from.all()])
    get_uploaders.short_description = 'Uploaded From'

    list_display = ("pk", "image_url", "image", "image_hash_value", "get_uploaders")


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("pk", "first_name", "last_name",
                    "username", "get_img_url")


@admin.register(FriendRequest)
class FriendRequest(admin.ModelAdmin):
    list_display = ("from_user", "to_user", "status")


@admin.register(UserData)
class UserDataAdmin(admin.ModelAdmin):
    list_display = ("get_username", "user_wins", "user_losses",
                    "user_elo_pong", "user_elo_purrinha")

@admin.register(Notifications)
class NotificationsAdmin(admin.ModelAdmin):
    list_display = ("user", "message", "is_read", "time")