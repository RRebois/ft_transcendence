from django.db import models

# Create your models here.

class UserStat(models.Model):
     user_id = models.IntegerField(primary_key=True)
     user_wins = models.IntegerField(default=0)
     user_losses = models.IntegerField(default=0)
     user_elo = models.IntegerField(default=900)