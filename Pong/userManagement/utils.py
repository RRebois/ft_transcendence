from django.core.mail import EmailMessage
from django.conf import settings
from django.http import JsonResponse
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from datetime import datetime, timedelta, timezone
from PIL import Image
from .models import User
import jwt
import os


def send_email(data):
    email = EmailMessage(
        to=[data['to_email']],
        subject=data['email_subject'],
        body=data['email_body'],
        from_email=settings.EMAIL_HOST_USER,
    )
    email.send()


def generate_JWT(user):
    payload = {
        'id': user.id,
        'exp': datetime.now(timezone.utc) + timedelta(seconds=15),  # time before expiration
        'iat': datetime.now(timezone.utc),  # Issued AT
    }
    secret = os.environ.get('SECRET_KEY')
    token = jwt.encode(payload, secret, algorithm='HS256')
    return token


def generate_refresh_JWT(user):
    payload = {
        'id': user.id,
        'exp': datetime.now(timezone.utc) + timedelta(days=1),  # Refresh token expiration
        'iat': datetime.now(timezone.utc)
    }
    secret = os.environ.get('REFRESH_SECRET_KEY')
    refresh = jwt.encode(payload, secret, algorithm='HS256')
    return refresh


def refresh_token_user(refresh_token, request):
    secret_refresh = os.environ.get('REFRESH_SECRET_KEY')
    try:
        payload = jwt.decode(refresh_token, secret_refresh, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Refresh token expired, please log in again.")

    user_id = payload.get('id')
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise AuthenticationFailed('User not found')

    new_token = generate_JWT(user)

    response = JsonResponse({'token': new_token})
    response.set_cookie(key='jwt', value=new_token, httponly=True)

    return user


def validate_image(image_path):

    valid_extension = ['jpg', 'jpeg', 'png', 'gif']
    if not image_path:
        return "profile_pics/default_pp.jpg"
    image = image_path
    ext = os.path.splitext(image.name)[1][1:].lower()

    # checking file extension, that it matches the chosen format
    if ext not in valid_extension:
        raise serializers.ValidationError("Only jpg/jpeg/png/gif and png images are allowed")

    # checking file content, that it matches the format given
    try:
        img = Image.open(image_path)
        if img.format not in ['JPEG', 'PNG', 'GIF']:
            raise serializers.ValidationError("Only jpg/jpeg/png/gif and png images are allowed")
    except Exception as e:
        raise serializers.ValidationError("Only jpg/jpeg/png/gif and png images are allowed")

    return image_path