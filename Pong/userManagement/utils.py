from django.core.mail import EmailMessage
from django.conf import settings
from django.http import JsonResponse
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from datetime import datetime, timedelta, timezone
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
        'exp': datetime.now(timezone.utc) + timedelta(minutes=2),  # time before expiration
        'iat': datetime.now(timezone.utc),  # Issued AT
    }
    secret = os.environ.get('SECRET_KEY')
    token = jwt.encode(payload, secret, algorithm='HS256')
    return token


def generate_refresh_JWT(user):
    payload = {
        'id': user.id,
        'exp': datetime.utcnow() + timedelta(minutes=15),  # Refresh token expiration
        'iat': datetime.utcnow()
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


def get_user_in_token(access_token):
    try:
        token = AccessToken(access_token)
        user = User.objects.get(id=token['user_id'])
        return user
    except User.DoesNotExist:
        raise AuthenticationFailed('User not found')