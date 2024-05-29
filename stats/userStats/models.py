from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from rest_framework_simplejwt.tokens import RefreshToken
from .manager import UserManager


class User(AbstractUser):
    username = models.CharField(unique=True, max_length=100)
    email = models.EmailField(unique=True, max_length=100)
    password = models.CharField(max_length=100, validators=[MinLengthValidator(8)])
    image = models.ImageField(default='profile_pics/default_pp.jpg', upload_to='profile_pics/')
    friends = models.ManyToManyField("self", blank=True)
    status_choices = [
        ('online', 'Online'),
        ('offline', 'Offline'),
    ]
    status = models.CharField(max_length=50, choices=status_choices, default='offline')
    totp = models.CharField(max_length=100, blank=True, null=True)
    tfa_activated = models.BooleanField(default=False)

    # def save(self, *args, **kwargs):
    #     super().save(*args, **kwargs)
    #     img = Image.open(self.image.path)
    #     if img.height > 200 or img.width > 200:
    #         new_img = (200, 200)
    #         img.thumbnail(new_img)
    #         img.save(self.image.path)

    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    def __str__(self):
        return self.email

    def get_username(self):
        return self.username

    def token(self):
        refresh = RefreshToken.for_user(self)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        }


class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='from_user')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='to_user')
    status_choices = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    status = models.CharField(max_length=20, choices=status_choices, default="pending")
    saved_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['from_user', 'to_user']


class UserData(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    user_wins = models.IntegerField(default=0)
    user_losses = models.IntegerField(default=0)
    user_winrate = models.FloatField(default=0)
    user_elo = models.IntegerField(default=900)

    def serialize(self):
        return {
            "id": self.id,
            "wins": self.user_wins,
            "losses": self.user_losses,
            "winrate": self.user_winrate,
            "elo": self.user_elo
        }
