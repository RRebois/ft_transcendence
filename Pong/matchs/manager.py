# from django.contrib.auth.models import BaseUserManager
# from .models import Match
from django.db import models
from userManagement.models import User

class   MatchManager(models.Manager):
    
    def create_match(self, players, winner, score=None, is_pong=True):
        if score is None:
            score = []
            
        match = self.model(game=is_pong, score=score)
        match.save()
        # if not is_pong:
        #     match.game = is_pong

        for player_username in players:
            player = User.objects.get(username=player_username)
            if player_username == winner:
                match.winner = player
            match.players.add(player)

        match.save(using=self._db)

        return match
    




# def email_valid(self, email):
#         try:
#             validate_email(email)
#         except ValidationError:
#             raise ValueError("Enter a valid email address.")

#     def create_42user(self, email, username, **extra_fields):
#         user = self.model(email=email,
#             username=username,
#             stud42=True,
#             **extra_fields
#         )
#         user.save(using=self._db)
#         return user

#     def create_user(self, email, username, password, **extra_fields):
#         if email:
#             email = self.normalize_email(email)
#             self.email_valid(email)
#         else:
#             raise ValueError("An email address is required")
#         if not username:
#             raise ValueError("Username is required")
#         user = self.model(email=email, username=username, **extra_fields)
#         user.set_password(password)
#         user.save(using=self._db)
#         return user

#     def create_superuser(self, email, username, password, **extra_fields):
#         extra_fields.setdefault('is_staff', True)
#         extra_fields.setdefault('is_superuser', True)
#         extra_fields.setdefault('is_active', True)

#         return self.create_user(email, username, password, **extra_fields)
