from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.postgres.fields import ArrayField
from .manager import UserManager


class User(AbstractUser):
    username = models.CharField(unique=True, max_length=100)
    email = models.EmailField(unique=True, max_length=100)
    password = models.CharField(max_length=100, blank=True)
    image_url = models.URLField(blank=True)
    image = models.ImageField(default='profile_pics/default_pp.jpg', upload_to='profile_pics/')
    friends = models.ManyToManyField("User", blank=True)
    status_choices = [
        ('online', 'Online'),
        ('offline', 'Offline'),
    ]
    status = models.CharField(max_length=50, choices=status_choices, default='offline')
    totp = models.CharField(max_length=100, blank=True, null=True)
    tfa_activated = models.BooleanField(default=False)
    stud42 = models.BooleanField(default=False)

    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    def __str__(self):
        return self.username

    def get_username(self):
        return self.username

    def token(self):
        refresh = RefreshToken.for_user(self)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        }

    def serialize(self):
        return {
            "First name": self.first_name,
            "Last name": self.last_name,
            "Email": self.email,
            "Username": self.username,
            "stud42": self.stud42,
        }


class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='from_user')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='to_user')
    status_choices = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted')
    ]
    status = models.CharField(max_length=20, choices=status_choices, default="pending")
    time = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['from_user', 'to_user']

    def get_to_user(self):
        return self.from_user.username


class UserData(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    user_wins = ArrayField(models.IntegerField(), default=[0, 0])
    user_losses = ArrayField(models.IntegerField(), default=[0, 0])
    user_winrate = ArrayField(models.FloatField(), default=[0, 0])
    user_elo_pong = ArrayField(models.IntegerField(), default=[900])
    user_elo_purrinha = ArrayField(models.IntegerField(), default=[900])
    user_highest = ArrayField(models.IntegerField(), default=[900, 900])

    def serialize(self):
        return {
            "id": self.id,
            "wins": self.user_wins,
            "losses": self.user_losses,
            "winrate": self.user_winrate,
            "elo_pong": self.user_elo_pong,
            "elo_purrinha": self.user_elo_purrinha,
            "elo_highest": self.user_highest,
        }

    def get_username(self):
        return self.user_id.username
