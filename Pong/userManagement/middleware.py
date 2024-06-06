from django.utils.deprecation import MiddlewareMixin
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser
from .views import authenticate_user

class JWTAuthenticationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        try:
            user = authenticate_user(request)
            request.user = user
        except AuthenticationFailed:
            request.user = AnonymousUser()
