from django.db import models
from django.utils import timezone
from django.core.validators import MinLengthValidator
from django.contrib.auth.models import AbstractUser
# Create your models here.

class userData(AbstractUser):
    # user_id = models.IntegerField()
    # username = models.CharField(max_length=50, unique=True)#, validators=[MinLengthValidator(5)])
    # password = models.CharField(max_length=49)
    # email = models.CharField(max_length=48)
    user_wins = models.IntegerField(default=0)
    user_losses = models.IntegerField(default=0)
    user_winrate = models.FloatField(default=0)
    user_elo = models.IntegerField(default=900)

    def serialize(self):
        return {
            "id": self.pk,
            "username": self.username,
            "email": self.email,
            "wins": self.user_wins,
            "losses": self.user_losses,
            "winrate": self.user_winrate,
            "elo": self.user_elo
        }