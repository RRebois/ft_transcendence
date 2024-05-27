from django.contrib.auth.forms import UserCreationForm
from django import forms
from . import models
from .models import *

class UserRegistrationForm(UserCreationForm):
    password1 = forms.CharField(widget=forms.PasswordInput,
                                help_text="Password must be 5 to 12 characters including \
                                1 uppercase character, 1 lowercase character, \
                                1 special character and 1 digit character.")
    password2 = forms.CharField(widget=forms.PasswordInput,
                                help_text="Repeat password.")
    class Meta:
        model = User
        fields = ["first_name", "last_name", "username", "email", "password1", "password2"]

    def clean_passwords(self):
        password = self.cleaned_data.get("password1")
        confirmation = self.cleaned_data.get("password2")

        if password and confirmation and password != confirmation:
            raise forms.ValidationError("Passwords must match")
        if len(password) < 8 or len(confirmation) < 8:
            raise forms.ValidationError("Passwords must be at least 8 characters long")
        return password

    def clean_username(self):
        username = self.cleaned_data.get("username")
        if len(username) < 5 or len(username) > 12:
            raise forms.ValidationError("Username must be between 5 and 12 characters and contain only alphanumeric characters")
        return username
