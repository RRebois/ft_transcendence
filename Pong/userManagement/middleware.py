from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from .views import authenticate_user
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from .views import authenticate_user
from .models import User

import jwt

# class JWTAuthenticationMiddleware(MiddlewareMixin):
#     def process_request(self, request):
#         jwt_cookie = request.COOKIES.get('jwt_access')
#
#         if jwt_cookie:
#             try:
#                 user = authenticate_user(request)
#                 request.user = user
#             except AuthenticationFailed:
#                 request.user = AnonymousUser()
#         else:
#             request.user = AnonymousUser()


class JWTAuthWSMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        path = scope['path']
        parts = path.split('/')
        token = parts[-2] if len(parts) >= 2 else None

        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('id')
                user = await self.get_user(user_id)
                scope['user'] = user
            except jwt.ExpiredSignatureError:
                scope['user'] = AnonymousUser()
            except jwt.InvalidTokenError:
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()

        return await self.app(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()
