import logging
import uuid

from django.db import models
from django.contrib.postgres.fields import ArrayField
from userManagement.models import User


# Create your models here.


class Match(models.Model):
    players = models.ManyToManyField('userManagement.User', related_name="matchs", default=list)
    winner = models.ManyToManyField('userManagement.User', related_name="winners", default=list, blank=True)
    is_pong = models.BooleanField(default=True)
    timeMatch = models.DateTimeField(auto_now_add=True)
    count = models.IntegerField(default=2)

    class Meta:
        ordering = ['-timeMatch']

    def get_winner_score(self):
        if self.winner:
            for score in self.scores.all():
                if score.player == self.winner:
                    return score.score  

    def serialize(self):
        winners_list = ['deleted_user' for i in range(0, self.count // 2)]
        if len(winners_list) > 0:
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


class Tournament(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    players = models.ManyToManyField('userManagement.User', related_name='tournaments', default=list)
    is_closed = models.BooleanField(default=False)
    winner = models.ForeignKey('userManagement.User', on_delete=models.SET_NULL, null=True, related_name='won_tournament')

    def serialize(self):
        return {
            'id': self.id,
            'matchs': {match.serialize() for match in self.tournament_matchs.all()},
            }

    def get_id(self):
        return self.id
    
    def get_unfinished_matchs(self):
        return [match for match in self.tournament_matchs.all() if not match.match]

# TODO update to pool tournament
class TournamentMatch(models.Model):

    # order_choices = [
    #     (1, 'first_match'),
    #     (2, 'second_match'),
    #     (3, 'final_match'),
    # ]
    # match_order = models.IntegerField(choices=order_choices)
    # player1 = models.ForeignKey('userManagement.User', on_delete=models.SET_NULL, null=True)
    # player2 = models.ForeignKey('userManagement.User', on_delete=models.SET_NULL, null=True)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='tournament_matchs')
    match = models.ForeignKey(Match, on_delete=models.SET_NULL, null=True, blank=True, related_name='tournament_match')
    score = ArrayField(models.IntegerField(), blank=True)

    def get_players(self):
        return [self.player1, self.player2]

    def serialize(self):
        match_result = {
            'players': {},
            'winner': ['n/a'],
        }
        if not self.match:
            match_result['players'] = {
                {'deleted_user': self.score[0]} if self.score else {'player1': 0},
                {'deleted_user': self.score[1]} if self.score else {'player2': 0},
            }
            if self.score:
                match_result['winner'] = ['deleted_user']
        else:
            serialized = self.match.serialize()
            match_result['players'] = serialized.players
            match_result['winner'] = serialized.winner

        return {
                match_result
            # self.match_order: {
            # }
        }


