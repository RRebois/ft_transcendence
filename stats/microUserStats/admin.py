from django.contrib import admin
from .models import *
# Register your models here.


@admin.register(UserStat)
class UserStatAdmin(admin.ModelAdmin):
    list_display = ("user_id", "user_wins", "user_losses",
                    "user_winrate", "user_elo")
