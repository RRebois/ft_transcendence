from django.contrib import admin
from django.contrib.admin.views.main import ChangeList
from .models import *
from userManagement.models import User
# Register your models here.


#https://books.agiliq.com/projects/django-admin-cookbook/en/latest/many_to_many.html
@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    # def players_display(self, obj):
    #     return ", ".join([
    #         User.username for User in obj.players.all()
    #     ])
    # players_display.short_description = "Players"
    list_display = ("pk", "winner", "score", "timeMatch")
    # filter_horizontal = ("players",)

    # def formfield_for_foreignkey(self, db_field, request, **kwargs):
    #     if db_field.name == "winner":
    #         if request._obj_ is not None:
    #             kwargs["queryset"] = request._obj_.score.all()[0]
    #         else:
    #             kwargs["queryset"] = User.objects.none()
    #     return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_form(self, request, obj=None, **kwargs):
        request._obj_ = obj
        return super().get_form(request, obj, **kwargs)
