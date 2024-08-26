from django.db import models
from userManagement.models import User


# Create your models here.


class Match(models.Model):
    players = models.ManyToManyField('userManagement.User', related_name="matchs", default=list)
    winner = models.ForeignKey('userManagement.User', on_delete=models.SET_NULL,
                               blank=True, null=True)
    is_pong = models.BooleanField(default=True)
    timeMatch = models.DateTimeField(auto_now_add=True)
    count = models.IntegerField(default=2)

    class Meta:
        ordering = ['-timeMatch']

    def serialize(self):
        return {
            'id': self.id,
            'game': 'pong' if self.is_pong else 'purrinha',
            "players": [{"username": score.player.username if score.player else "deleted_user", "score": score.score}
                        for score in self.scores.all()],
            "count": self.count,
            "winner": self.winner.username if self.winner else "deleted_user",
            "timestamp": self.timeMatch.strftime("%b %d %Y, %I:%M %p"),
        }


class Score(models.Model):
    player = models.ForeignKey('userManagement.User', on_delete=models.SET_NULL, null=True, related_name='scores')
    match = models.ForeignKey('Match', on_delete=models.CASCADE, related_name='scores')
    score = models.IntegerField(default=0)
