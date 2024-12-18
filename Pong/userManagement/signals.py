import os
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserData
from .utils import gen_timestamp
from configFiles.globals import BOT_NAME
from configFiles.settings import DEBUG

@receiver(post_save, sender=User)
def create_user_data_if_new_user(sender, instance, created, **kwargs):
    if created:
        timestamp = gen_timestamp()
        user_data = UserData.objects.create(user_id=instance)
        user_data.user_losses.append(0)
        user_data.user_losses.append(0)
        user_data.user_wins.append(0)
        user_data.user_wins.append(0)
        user_data.user_elo_pong.append({'elo': 900, 'timestamp': timestamp})
        user_data.user_elo_purrinha.append({'elo': 900, 'timestamp': timestamp})
        user_data.save()
        if instance.username == os.environ.get('DJANGO_SUPERUSER_USERNAME'):
            User.objects.create(username=BOT_NAME, email="a")
            User.objects.create(username="guest", email="b")
            if DEBUG:
                for i in range(10):
                    User.objects.create_superuser(username=f"testing{i + 1}", email=f"{i}@mail.com", password=f"{os.environ.get('DJANGO_SUPERUSER_PASSWORD')}")