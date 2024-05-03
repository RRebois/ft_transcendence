from django.contrib import admin
from .models import *

@admin.register(userData)
class userDataAdmin(admin.ModelAdmin):
    list_display = ("pk", "username", "user_wins", "user_losses",
                    "user_winrate", "user_elo")
