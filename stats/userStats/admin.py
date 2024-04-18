from django.contrib import admin
from .models import *
# Register your models here.

class UserStatAdmin(admin.ModelAdmin):
    list_display = ["id", "wins", "losses", "elo"]

admin.site.register(UserStat, admin.ModelAdmin)