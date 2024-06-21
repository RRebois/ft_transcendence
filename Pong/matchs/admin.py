from django.contrib import admin
from django.contrib.admin.views.main import ChangeList
from .models import *
from userManagement.models import User
# Register your models here.


#https://books.agiliq.com/projects/django-admin-cookbook/en/latest/many_to_many.html
@admin.register(PlayerScore)
class PlayerScoreAdmin(admin.ModelAdmin):
    list_display = ('player', 'match', 'score')
    search_fields = ('player__username', 'match__id')

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    def players_display(self, obj):
        return ", ".join([
            User.username for User in obj.players.all()
        ])
    players_display.short_description = "Players"
    
    def scores_display(self, obj):
        return ", ".join([f"{score.player.username}: {score.score}" for score in obj.scores.all()])
    scores_display.short_description = "Scores"

    list_display = ("pk", "winner", "players_display", "scores_display", "timeMatch")
    filter_horizontal = ("players",)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "winner":
            if request._obj_ is not None:
                kwargs["queryset"] = request._obj_.players.all()
            else:
                kwargs["queryset"] = User.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_form(self, request, obj=None, **kwargs):
        request._obj_ = obj
        return super().get_form(request, obj, **kwargs)
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if 'players' in form.cleaned_data:
            for player in form.cleaned_data['players']:
                PlayerScore.objects.get_or_create(player=player, match=obj)
