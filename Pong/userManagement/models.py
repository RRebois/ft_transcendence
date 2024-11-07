import os

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.postgres.fields import ArrayField
from .manager import UserManager


class Avatars(models.Model):
    server_url = os.environ.get("SERVER_URL")
    image_url = models.URLField(blank=True)
    image = models.ImageField(upload_to='profile_pics/', max_length=255, blank=True)
    image_hash_value = models.CharField(blank=True)
    uploaded_from = models.ManyToManyField("User", blank=True)

    def serialize(self):
        return {
            "image": self.image.url,
            "id": self.pk,
            "url": self.server_url
        }


class User(AbstractUser):
    username = models.CharField(unique=True, max_length=100)
    email = models.EmailField(unique=True, max_length=100)
    password = models.CharField(max_length=100, blank=True)
    avatar_id = models.ForeignKey(Avatars, on_delete=models.SET_NULL, blank=True, null=True)  # id of image
    friends = models.ManyToManyField("User", blank=True)
    status_choices = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('in-game', 'In-game'),
    ]
    status = models.CharField(max_length=50, choices=status_choices, default='offline')
    totp = models.CharField(max_length=100, blank=True, null=True)
    tfa_activated = models.BooleanField(default=False)
    stud42 = models.BooleanField(default=False)
    active_ws = models.IntegerField(default=0)

    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    def __str__(self):
        return self.username

    def get_is_stud(self):
        return self.stud42

    def get_username(self):
        return self.username

    def token(self):
        refresh = RefreshToken.for_user(self)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        }

    def get_img_url(self):
        if self.avatar_id:
            return self.avatar_id.image_url if self.avatar_id.image_url else self.avatar_id.image.url
        else:
            return "/media/profile_pics/default_pp.jpg"

    def get_img_serialize(self):
        if self.avatar_id:
            if self.avatar_id.image_url:
                if (self.avatar_id.image_url).startswith('http'):
                    return self.avatar_id.image_url
                else:
                    return f"{os.environ.get('SERVER_URL')}{self.avatar_id.image_url}"
            else:
                return f"{os.environ.get('SERVER_URL')}{self.avatar_id.image.url}"
        else:
            url = os.environ.get('SERVER_URL')
            full_url = f"{url}/media/profile_pics/default_pp.jpg"
            return full_url

    def serialize(self):
        return {
            "First name": self.first_name,
            "Last name": self.last_name,
            "Email": self.email,
            "Username": self.username,
            "stud42": self.stud42,
            "2fa": self.tfa_activated,
            "img": self.get_img_serialize(),
            "status": self.status,
            "stats": self.data.serialize() if hasattr(self, 'data') else None
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

    def get_friends_avatars(self):
        return {
            "avatar": self.to_user.get_img_url()
        }


class UserData(models.Model):
    user_id = models.OneToOneField(User, on_delete=models.CASCADE, related_name='data')
    user_wins = ArrayField(models.IntegerField(), default=list)
    user_losses = ArrayField(models.IntegerField(), default=list)
    user_elo_pong = ArrayField(models.JSONField(encoder=None, decoder=None), default=list)
    user_elo_purrinha = ArrayField(models.JSONField(encoder=None, decoder=None), default=list)

    def serialize(self):
        winrate_pong = self.user_wins[0] / (self.user_wins[0] + self.user_losses[0]) if (self.user_wins[0] + self.user_losses[0]) != 0 else 0
        winrate_purrinha = self.user_wins[1] / (self.user_wins[1] + self.user_losses[1]) if (self.user_wins[1] + self.user_losses[1]) != 0 else 0
        return {
            'pong': {
                'wins': self.user_wins[0],
                'losses': self.user_losses[0],
                'elo': self.user_elo_pong,
                'winrate': winrate_pong,
                'max_elo': max(self.user_elo_pong, key=lambda x: x['elo']),
                'min_elo': min(self.user_elo_pong, key=lambda x: x['elo']),
            },
            'purrinha': {
                'wins': self.user_wins[1],
                'losses': self.user_losses[1],
                'elo': self.user_elo_purrinha,
                'winrate': winrate_purrinha,
                'max_elo': max(self.user_elo_purrinha, key=lambda x: x['elo']),
                'min_elo': min(self.user_elo_purrinha, key=lambda x: x['elo']),
            },
        }

    def get_username(self):
        return self.user_id.username


class Notifications(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    time = models.DateTimeField(auto_now=True)
    is_read = models.BooleanField(default=False)

    def serialize(self):
        return {
            "message": self.message,
            "time": self.time,
            "is_read": self.is_read
        }