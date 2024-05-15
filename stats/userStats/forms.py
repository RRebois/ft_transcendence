from django.contrib.auth.forms import UserCreationForm
from django import forms
from .models import *

class UserRegistrationForm(UserCreationForm):
    password1 = forms.CharField(widget=forms.PasswordInput, min_length=5,
                                help_text="Password must be 5 to 12 characters including \
                                1 uppercase character, 1 lowercase character, \
                                1 special character and 1 digit character.")
    password2 = forms.CharField(widget=forms.PasswordInput, min_length=5,
                                help_text="Repeat password.")
    class Meta:
        model = userData
        fields = ["username", "email", "password1", "password2"]

    def clean_passwords(self):
        password = self.cleaned_data.get("password1")
        confirmation = self.cleaned_data.get("password2")

        if password and confirmation and password != confirmation:
            raise forms.ValidationError("Passwords must match")
        if len(password) < 5 or len(confirmation) < 5:
            raise forms.ValidationError("Passwords must be at least 5 characters")
        return password

    def clean_username(self):
        username = self.cleaned_data.get("username")
        if len(username) < 5 or len(username) > 12:
            raise forms.ValidationError("Username must be between 5 and 12 characters and contain only alphanumeric characters")
        return username
