from django.apps import AppConfig


class UserstatsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'userManagement'

    def ready(self):
        import userManagement.signals