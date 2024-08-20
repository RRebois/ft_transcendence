from django.contrib import admin
from .models import *
from userManagement.models import User
# Register your models here.


#https://books.agiliq.com/projects/django-admin-cookbook/en/latest/many_to_many.html
@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    def players_display(self, obj):
        return ", ".join([
            score.player.username if score.player else "deleted_user" for score in obj.scores.all()
        ])

    players_display.short_description = "Players"

    def scores_display(self, obj):
        return ", ".join([f"{score.player.username if score.player else 'deleted_user'}: {score.score}" for score in
                          obj.scores.all()])

    scores_display.short_description = "Scores"

    def winners_display(self, obj):
        return ", ".join([f"{winner.username if winner else 'deleted_user'}" for winner in
                          obj.winners.all()])

    winners_display.short_description = "Winners"

    list_display = ("pk", "winners_display", "players_display", "scores_display", "timeMatch")
    filter_horizontal = ("players",)

    def get_form(self, request, obj=None, **kwargs):
        request._obj_ = obj
        return super().get_form(request, obj, **kwargs)

@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = ("player", "match", "score")
    search_fields = ('player__username', 'match__id')
