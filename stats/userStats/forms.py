from django.contrib.auth.forms import UserCreationForm
from django import forms
from django.contrib.auth import get_user_model

class userRegistrationForm(UserCreationForm):
    class Meta:
        model = get_user_model()
        fields = ("username", "email", "password1", "password2")

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password1")
        password_confirmation = cleaned_data.get("password2")

        if password != password_confirmation:
            return
            raise forms.ValidationError("Passwords must match")

    def clean_username(self):
        username = self.cleaned_data.get("username")
        if len(username) < 5 or len(username) > 12:
            raise forms.ValidationError("Username must be between 5 and 12 characters")
        return username
