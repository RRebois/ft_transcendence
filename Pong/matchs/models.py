from django.db import models
from django.contrib.postgres.fields import ArrayField

# Create your models here.


class PlayerScore(models.Model):
    player = models.ForeignKey('userManagement.User', on_delete=models.SET_NULL, null=True, related_name='scores')
    match = models.ForeignKey('Match', on_delete=models.CASCADE, related_name='scores')
    score = models.IntegerField(default=0)


class Match(models.Model):
    players = models.ManyToManyField('userManagement.User', related_name="matchs", default=list)
    winner = models.ForeignKey('userManagement.User', on_delete=models.SET_NULL,
                                blank=True, null=True)
    is_pong = models.BooleanField(default=True)
    timeMatch = models.DateTimeField(auto_now_add=True)
    #timeMatchEnded?changethe auto now to blank = null and value will be added when match ends


    class Meta:
        ordering = ['-timeMatch']

    def serialize(self):
        return {
            'id': self.id,
            'game' : 'Pong' if self.is_pong else 'Purrinha',
            "players": {score.player.username if score.player else "deleted_user": score.score for score in self.scores.all()},
            "winner": self.winner.username if self.winner else "deleted_user",
            "timestamp": self.timeMatch.strftime("%b %d %Y, %I:%M %p"),
        }