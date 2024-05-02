from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class userGameStat(AbstractUser):
    user_id = models.IntegerField(primary_key=True)
    username = models.CharField(max_length=50)
    password = models.CharField(max_length=50)
    email = models.CharField(max_length=50)
    user_wins = models.IntegerField(default=0)
    user_losses = models.IntegerField(default=0)
    user_winrate = models.FloatField(default=0)
    user_elo = models.IntegerField(default=900)

    def serialize(self):
        return {
            "id": self.user_id,
            "username": self.username,
            "email": self.email,
            "wins": self.user_wins,
            "losses": self.user_losses,
            "winrate": self.user_winrate,
            "elo": self.user_elo
        }