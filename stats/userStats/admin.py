from django.contrib import admin
from .models import *

@admin.register(userGameStat)
class userGameStatAdmin(admin.ModelAdmin):
    list_display = ("user_id", "user_wins", "user_losses",
                    "user_winrate", "user_elo")
