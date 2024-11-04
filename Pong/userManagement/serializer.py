from .models import *
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
from configFiles.globals import *
from configFiles.settings import FILE_UPLOAD_MAX_MEMORY_SIZE
from PIL import Image
import math
import jwt
import pyotp
import os
import re
from datetime import datetime, timedelta, timezone
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # This handler writes logs to stdout
    ]
)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=100, min_length=8, write_only=True)
    password2 = serializers.CharField(max_length=100, min_length=8, write_only=True)
    username = serializers.CharField(max_length=12, min_length=5)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'username', 'password', 'password2']

    def validate(self, attrs):
        logging.debug("Validating user registration")
        username_pattern = re.compile("^[a-zA-Z0-9-_]{5,12}$")
        name_pattern = re.compile("^[a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ\\-]+$")
        password_pattern = re.compile("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[?!@$ %^&*]).{8,}$")
        email_pattern = re.compile("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$")

        email = attrs.get('email', '')
        first_name = attrs.get('first_name', '')
        last_name = attrs.get('last_name', '')
        username = attrs.get('username', '')
        password = attrs.get('password', '')
        password2 = attrs.get('password2', '')
        logging.debug(f"Email: {email}, First name: {first_name}, Last name: {last_name}, Username: {username}, Password: {password}, Password2: {password2}")

        if not email_pattern.match(email):
            raise serializers.ValidationError("Invalid email format")
        if not name_pattern.match(first_name):
            raise serializers.ValidationError("Firstname must contain only alphabetic characters and hyphens (-)")
        if not name_pattern.match(last_name):
            raise serializers.ValidationError("Lastname must contain only alphabetic characters and hyphens (-)")
        if not username_pattern.match(username):
            raise serializers.ValidationError("Username must contain only alphanumeric characters and hyphens (- or _)")
        if username in ['guest', BOT_NAME]:
            raise serializers.ValidationError("This username is forbidden")
        if not password_pattern.match(password):
            raise serializers.ValidationError("Password must contain at least 8 characters, including uppercase, lowercase, number and special character (?!@$ %^&*)")
        if password != password2:
            raise serializers.ValidationError("Passwords don't match")
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
        avatar = Avatars.objects.create(
            image_url=data.get('image')
        )
        user = User.objects.create_42user(
            email=data['email'],
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            username=data.get('username'),
            avatar_id=avatar
        )
        avatar.uploaded_from.add(user)
        avatar.save()
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
        logging.debug("[SERIALIZER VALIDATOR] Validating user login")

        username = attrs.get('username')
        password = attrs.get('password')
        logging.debug(f"Username: {username}, Password: {password}")
        request = self.context.get('request')

        user = authenticate(request, username=username, password=password)
        logging.debug(str(user))
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
    username = serializers.CharField(max_length=12, min_length=5)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'language']

    def validate(self, attrs):
        username_pattern = re.compile("^[a-zA-Z0-9-_]{5,12}$")
        name_pattern = re.compile("^[a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ\\-]+$")
        email_pattern = re.compile("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$")

        username = attrs.get('username', '')
        first_name = attrs.get('first_name', '')
        last_name = attrs.get('last_name', '')
        email = attrs.get('email', '')
        language = attrs.get('language', '')
        logging.debug(f"Username: {username}, First name: {first_name}, Last name: {last_name}, Email: {email}, Language: {language}")

        if not email_pattern.match(email):
            raise serializers.ValidationError("Invalid email format")
        if not name_pattern.match(first_name):
            raise serializers.ValidationError("Firstname must contain only alphabetic characters and hyphens (-)")
        if not name_pattern.match(last_name):
            raise serializers.ValidationError("Lastname must contain only alphabetic characters and hyphens (-)")
        if username in ['guest', BOT_NAME]:
            raise serializers.ValidationError("This username is forbidden")
        if not username_pattern.match(username):
            raise serializers.ValidationError("Username must contain only alphanumeric characters and hyphens (- or _)")
        # if language not in ['en', 'fr']:
        # TODO check language
        return attrs

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.language = validated_data.get('language', instance.language)
        instance.save()
        return instance


def convert_to_megabyte(file_size):
    file_size_in_mb = round(file_size / (1000 * 1000))
    return math.ceil(file_size_in_mb)


class ProfilePicSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(max_length=255, allow_empty_file=False, use_url=True, required=False)

    class Meta:
        model = Avatars
        fields = ['image']

    def validate_image(self, value):
        # checking extension
        valid_extension = ['jpg', 'jpeg', 'png']
        ext = os.path.splitext(value.name)[1][1:].lower()
        if ext not in valid_extension:
            raise serializers.ValidationError("Only jpg/jpeg and png files are allowed")

        # checking file content, that it matches the format given
        try:
            img = Image.open(value)
            if img.format not in ['JPEG', 'PNG', 'JPG']:
                raise serializers.ValidationError("Only jpg/jpeg and png images are allowed")
        except Exception as e:
            raise serializers.ValidationError("Only jpg/jpeg and png images are allowed")
        if value.size > FILE_UPLOAD_MAX_MEMORY_SIZE:
            raise serializers.ValidationError("File cannot be larger than "
                                              f"{convert_to_megabyte(FILE_UPLOAD_MAX_MEMORY_SIZE)}MB.")


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(max_length=100, min_length=8, write_only=True)
    new_password = serializers.CharField(max_length=100, min_length=8, write_only=True)
    confirm_password = serializers.CharField(max_length=100, min_length=8, write_only=True)

    def validate(self, attrs):
        password_pattern = re.compile("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[?!@$ %^&*]).{8,}$")

        user = self.context['user']
        old_password = attrs.get('old_password')
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')

        if not user.check_password(old_password):
            raise serializers.ValidationError("Old password is incorrect")
        if not password_pattern.match(new_password):
            raise serializers.ValidationError("Password must contain at least 8 characters, including uppercase, lowercase, number and special character (?!@$ %^&*)")
        if new_password != confirm_password:
            raise serializers.ValidationError("New passwords do not match")
        if new_password == old_password:
            raise serializers.ValidationError("Your new password is the same as the old password")

        validate_password(new_password, user)
        return attrs

    def update(self, instance, validated_data):
        instance.old_password = validated_data.get('old_password', instance.username)
        instance.new_password = validated_data.get('new_password', instance.first_name)
        instance.confirm_password = validated_data.get('confirm_password', instance.last_name)
        instance.save()
        return instance

    def save(self):
        user = self.context['user']
        new_password = self.validated_data['new_password']
        user.set_password(new_password)
        user.save()

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=100)

    class Meta:
        model = User
        fields = ['email']

    def validate(self, attrs):
        email = attrs.get('email')
        logging.debug(f"email in serializer is: {email}")
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=attrs.get('email'))
            if user.stud42:
                raise serializers.ValidationError("This email is associated to a 42 account, "
                                                  "you can't change the password.")
            uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)
            request = self.context.get('request')
            relative_link = "/set-reset-password/" + uidb64 + "/" + token
            current_site = get_current_site(request).domain
            abslink = f"https://{current_site}:3000{relative_link}"
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
