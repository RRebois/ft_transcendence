from django.db import models
from userManagement.models import User


# Create your models here.


class Match(models.Model):
    players = models.ManyToManyField('userManagement.User', related_name="matchs", default=list)
    winner = models.ManyToManyField('userManagement.User', related_name="winners", default=list)
    is_pong = models.BooleanField(default=True)
    timeMatch = models.DateTimeField(auto_now_add=True)
    count = models.IntegerField(default=2)

    class Meta:
        ordering = ['-timeMatch']

    def serialize(self):
        winners_list = ['deleted_user' for i in range(1, self.count // 2)]
        for i, winner in enumerate(self.winner.all()):
            winners_list[i] = winner.username

        return {
            'id': self.id,
            'game': 'pong' if self.is_pong else 'purrinha',
            "players": [{"username": score.player.username if score.player else "deleted_user", "score": score.score}
                        for score in self.scores.all()],
            "count": self.count,
            "winner": winners_list,
            "timestamp": self.timeMatch.strftime("%b %d %Y, %I:%M %p"),
        }


class Score(models.Model):
    player = models.ForeignKey('userManagement.User', on_delete=models.SET_NULL, null=True, related_name='scores')
    match = models.ForeignKey('Match', on_delete=models.CASCADE, related_name='scores')
    score = models.IntegerField(default=0)
