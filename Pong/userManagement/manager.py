from django.contrib.auth.models import BaseUserManager
from django.core.exceptions import ValidationError
from django.core.validators import validate_email

class UserManager(BaseUserManager):
    def email_valid(self, email):
        try:
            validate_email(email)
        except ValidationError:
            raise ValueError("Enter a valid email address.")

    def create_user(self, email, username, password, **extra_fields):
        if email:
            email = self.normalize_email(email)
            self.email_valid(email)
        else:
            raise ValueError("An email address is required")
        if not username:
            raise ValueError("Username is required")
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        return self.create_user(email, username, password, **extra_fields)
