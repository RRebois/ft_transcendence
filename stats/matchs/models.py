from django.db import models
# Create your models here.


class Match(models.Model):
    players = models.ManyToManyField('userStats.User', related_name="players")
    winner = models.ForeignKey('userStats.User', on_delete=models.CASCADE,
                               blank=True, null=True)
    timeMatch = models.DateTimeField(auto_now_add=True)
    #timeMatchEnded?

    class Meta:
        ordering = ['-timeMatch']

    def serialize(self):
        return {
            'id': self.id,
            "players": [User.username for User in self.players.all()],
            "winner": self.winner.username,
            "timestamp": self.timeMatch.strftime("%b %d %Y, %I:%M %p"),
        }
