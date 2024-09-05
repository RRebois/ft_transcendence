from django.db.models.signals import pre_delete
from django.dispatch import receiver
from userManagement.models import User

@receiver(pre_delete, sender=User)
def delete_match_if_no_users(sender, instance, **kwargs):
    matchs = instance.matchs.all()
    for match in matchs:
        if match.players.count() <= 1:
            match.delete()
    tournaments = instance.tournaments.all()
    for tournament in tournaments:
        if tournament.players.count() <= 1:
            tournament.delete()