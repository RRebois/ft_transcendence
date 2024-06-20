from django.db import models
from django.contrib.postgres.fields import ArrayField

# Create your models here.


class Match(models.Model):
    players = models.ManyToManyField('userManagement.User', related_name="players", default=list)
    winner = models.ForeignKey('userManagement.User', on_delete=models.CASCADE,
                               blank=True, null=True)
    score = models.JSONField(default=dict)
    is_pong = models.BooleanField(default=True)
    timeMatch = models.DateTimeField(auto_now_add=True)
    #timeMatchEnded?changethe auto now to blank = null and value will be added when match ends


    class Meta:
        ordering = ['-timeMatch']

    def serialize(self):
        return {
            'id': self.id,
            'game' : 'Pong' if self.is_pong else 'Purrinha',
            "players": [
                {
                    'username': User['username'],
                    'score': self.score[User['username']],
                }
                for User in self.players.all()
                ],
            "winner": self.winner.username,
            "timestamp": self.timeMatch.strftime("%b %d %Y, %I:%M %p"),
        }
