from django.db import models
from django.contrib.postgres.fields import ArrayField
# Create your models here.


class Match(models.Model):
    players = models.ManyToManyField('userManagement.User', related_name="players")
    winner = models.ForeignKey('userManagement.User', on_delete=models.CASCADE,
                               blank=True, null=True)
    score = ArrayField(models.IntegerField(), default=[])
    timeMatch = models.DateTimeField(auto_now_add=True)
    #timeMatchEnded?

    class Meta:
        ordering = ['-timeMatch']

    def serialize(self):
        return {
            'id': self.id,
            "players": [User.username for User in self.players.all()],
            "winner": self.winner.username,
            "score": self.score,
            "timestamp": self.timeMatch.strftime("%b %d %Y, %I:%M %p"),
        }
