from .models import User
from .utils import *
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.hashers import check_password
from django.contrib.auth.password_validation import validate_password
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import smart_str, force_str, smart_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.urls import reverse
from django.http import JsonResponse
from rest_framework.exceptions import AuthenticationFailed
from PIL import Image
import jwt
import pyotp
import os
import re
from datetime import datetime, timedelta, timezone


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=100, min_length=8, write_only=True)
    password2 = serializers.CharField(max_length=100, min_length=8, write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'username', 'password', 'password2']

    def validate(self, attrs):
        pattern = re.compile("^[a-zA-Z]+([ '-][a-zA-Z]+)*$")
        pattern_username = re.compile("^[a-zA-Z0-9]+([-][a-zA-Z0-9]+)*$")
        password = attrs.get('password', '')
        password2 = attrs.get('password2', '')
        if not password.isalnum() or password.islower() or password.isupper():
            raise serializers.ValidationError("Passwords must contain at least 1 digit, 1 lowercase and 1 uppercase character.")
        if password != password2:
            raise serializers.ValidationError("Passwords don't match.")

        first = attrs.get('first_name', '')
        if not pattern.match(first):
            raise serializers.ValidationError("All characters of first name must be alphabetic characters. Spaces, apostrophes and hyphens are allowed, if it's in the middle and with no repetitions.")

        last = attrs.get('last_name', '')
        if not pattern.match(last):
            raise serializers.ValidationError("All characters of last name must be alphabetic characters. Spaces, apostrophes and hyphens are allowed, if it's in the middle and with no repetitions.")

        username = attrs.get('username', '')
        if not pattern_username.match(username):
            raise serializers.ValidationError("Username must be alphanumeric. Hyphens are allowed, if it's in the middle and with no repetitions.")

        validate_password(password, username)
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            username=validated_data.get('username'),
            password=validated_data.get('password'),
        )
        return user


class Register42Serializer(serializers.ModelSerializer):

    def create(self, data):
        user = User.objects.create_42user(
            email=data['email'],
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            username=data.get('username'),
            image_url=data.get('image'),
        )
        return user


class LoginSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=100)
    password = serializers.CharField(max_length=50, write_only=True)
    otp = serializers.CharField(max_length=6, write_only=True, required=False)

    class Meta:
        model = User
        fields = ['username', 'password', 'otp']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        request = self.context.get('request')

        user = authenticate(request, username=username, password=password)
        if not user:
            raise AuthenticationFailed("Invalid credentials, please try again")

        token = generate_JWT(user)
        refresh = generate_refresh_JWT(user)

        return {
            'user': user,
            'jwt_access': token,
            'jwt_refresh': refresh
        }


class EditUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'language']

    def validate(self, attrs):
        pattern = re.compile("^[a-zA-Z]+([ '-][a-zA-Z]+)*$")
        pattern_username = re.compile("^[a-zA-Z0-9]+([-][a-zA-Z0-9]+)*$")

        first = attrs.get('first_name', '')
        if not pattern.match(first):
            raise serializers.ValidationError(
                "All characters of first name must be alphabetic characters. Spaces, apostrophes and hyphens are allowed, if it's in the middle and with no repetitions.")

        last = attrs.get('last_name', '')
        if not pattern.match(last):
            raise serializers.ValidationError(
                "All characters of last name must be alphabetic characters. Spaces, apostrophes and hyphens are allowed, if it's in the middle and with no repetitions.")

        username = attrs.get('username', '')
        if not pattern_username.match(username):
            raise serializers.ValidationError("Username must be alphanumeric. Hyphens are allowed, if it's in the middle and with no repetitions.")
        return attrs

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.language = validated_data.get('language', instance.language)
        instance.save()
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(max_length=100, min_length=8, write_only=True)
    new_password = serializers.CharField(max_length=100, min_length=8, write_only=True)
    confirm_password = serializers.CharField(max_length=100, min_length=8, write_only=True)

    def validate(self, attrs):
        user = self.context['user']
        old_password = attrs.get('old_password')
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')

        if not user.check_password(old_password):
            raise serializers.ValidationError("Old password is incorrect")
        if new_password != confirm_password:
            raise serializers.ValidationError("New passwords do not match")

        validate_password(new_password, user)
        return attrs

    def update(self, instance, validated_data):
        instance.old_password = validated_data.get('old_password', instance.username)
        instance.new_password = validated_data.get('new_password', instance.first_name)
        instance.confirm_password = validated_data.get('confirm_password', instance.last_name)
        instance.save()
        return instance


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=100)

    class Meta:
        model = User
        fields = ['email']

    def validate(self, attrs):
        email = attrs.get('email')
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=attrs.get('email'))
            if user.stud42:
                raise serializers.ValidationError("This email is associated to a 42 account, you can't change the password.")
            uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)
            request = self.context.get('request')
            relative_link = reverse('reset_confirmed', kwargs={'uidb64': uidb64, 'token': token})
            current_site = get_current_site(request).domain
            abslink = f"http://{current_site}:8080{relative_link}"
            content = f"Hello {user.username}, use this link to reset your password: {abslink}"
            data = {
                'email_body': content,
                'to_email': user.email,
                'email_subject': 'Password reset request',
            }
            send_email(data)
        else:
            raise serializers.ValidationError("No user with that email exists")

        return super().validate(attrs)


class SetNewPasswordSerializer(serializers.Serializer):
    uidb64 = serializers.CharField(write_only=True, required=True)
    token = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, max_length=100, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True, max_length=100, min_length=8)

    def validate(self, attrs):
        try:
            user_id = smart_str(urlsafe_base64_decode(attrs['uidb64']))
            user = User.objects.get(id=user_id)

            if not PasswordResetTokenGenerator().check_token(user, attrs['token']):
                raise serializers.ValidationError("Invalid or expired reset password token")

            new_password = attrs.get('new_password')
            confirm_password = attrs.get('confirm_password')
            if new_password != confirm_password:
                raise serializers.ValidationError("New passwords do not match")
            validate_password(new_password, user)
            user.set_password(attrs['new_password'])
            user.save()

        except DjangoUnicodeDecodeError:
            raise serializers.ValidationError("Invalid reset password token")

        return super().validate(attrs)


class VerifyOTPSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField()
    otp = serializers.CharField(max_length=6, write_only=True)

    class Meta:
        model = User
        fields = ['user_id', 'otp']

    def validate(self, attrs):
        user_id = attrs.get('user_id')
        otp = attrs.get('otp')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found")

        if not user.tfa_activated:
            raise AuthenticationFailed("2FA not enabled for this user")

        totp = pyotp.TOTP(user.totp)
        if not totp.verify(otp):
            raise AuthenticationFailed("Invalid OTP")

        token = generate_JWT(user)
        refresh = generate_refresh_JWT(user)

        return {
            'user': user,
            'jwt_access': token,
            'jwt_refresh': refresh
        }


class CheckPassword(serializers.Serializer):
    password = serializers.CharField(max_length=100, min_length=8, write_only=True, required=True)

    def validate(self, attrs):
        user = self.context['user']
        password = attrs.get('password')

        if not user.check_password(password):
            raise serializers.ValidationError("Password is incorrect")
        return attrs
