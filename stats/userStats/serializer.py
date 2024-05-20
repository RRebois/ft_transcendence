from .models import User
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import smart_str, force_str, smart_bytes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
import jwt
import pyotp
import os
from datetime import datetime, timedelta, timezone


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=100, min_length=8, write_only=True)
    password2 = serializers.CharField(max_length=100, min_length=8, write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'username', 'password', 'password2']

    def validate_passwords(self, attrs):
        password = attrs.get('password', '')
        password2 = attrs.get('password2', '')
        if password != password2:
            raise serializers.ValidationError("passwords don't match")
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
        otp = attrs.get('otp')
        request = self.context.get('request')

        user = authenticate(request, username=username, password=password)
        if not user:
            raise AuthenticationFailed("Invalid, please try again")

        if user.tfa_activated:
            if not otp:
                raise AuthenticationFailed("OTP required for your account")
            totp = pyotp.TOTP(user.totp)
            if not totp.verify(otp):
                raise AuthenticationFailed("Invalid OTP")

        payload = {
            'id': user.id,
            'exp': datetime.now(timezone.utc) + timedelta(hours=1),  # time before expiration
            'iat': datetime.now(timezone.utc),  # Issued AT
        }
        secret = os.environ.get('SECRET_KEY')
        token = jwt.encode(payload, secret, algorithm='HS256')

        return {
            'user': user,
            'token': token
        }


class UserSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(max_length=255, allow_empty_file=False, use_url=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'image']


# class PasswordResetSerializer(serializers.Serializer):
#     email = serializers.EmailField(max_length=100)
#     class Meta:
#         model = User
#         fields = ['email']
#
#     def validate(self, attrs):
#         email = attrs.get('email')
#         if User.objects.filter(email=email).exists():
#             user = User.objects.get(email=email)
