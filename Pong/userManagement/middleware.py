from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from .views import authenticate_user
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from .views import authenticate_user
from .models import User

import logging
import jwt

logger = logging.getLogger('userManagement')

class JWTAuthenticationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        logger.debug("Processing request in JWTAuthenticationMiddleware")
        jwt_cookie = request.COOKIES.get('jwt_access')
        logger.debug(f"JWT Cookie: {jwt_cookie}")

        if jwt_cookie:
            try:
                user = authenticate_user(request)
                request.user = user
                logger.debug(f"Authenticated user: {user.username}")
            except AuthenticationFailed:
                request.user = AnonymousUser()
                logger.debug("Authentication failed, setting user as AnonymousUser")
        else:
            request.user = AnonymousUser()
            logger.debug("JWT cookie not found, setting user as AnonymousUser")


class JWTAuthWSMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        logger.warning("JWTAuthWSMiddleware called")
        path = scope['path']
        parts = path.split('/')
        token = parts[-2] if len(parts) >= 2 else None

        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('id')
                logger.warning(f"user id: {user_id}")
                user = await self.get_user(user_id)
                scope['user'] = user
                logger.warning(f"Authenticated user: {user.username}")
            except jwt.ExpiredSignatureError:
                logger.warning("Token expired")
                scope['user'] = AnonymousUser()
            except jwt.InvalidTokenError:
                logger.warning("Invalid token")
                scope['user'] = AnonymousUser()
        else:
            logger.warning("No token provided")
            scope['user'] = AnonymousUser()

        return await self.app(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()
