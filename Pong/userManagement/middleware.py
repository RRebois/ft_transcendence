from django.utils.deprecation import MiddlewareMixin
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser
from .views import authenticate_user

import logging

logger = logging.getLogger('userManagement')

# class JWTAuthenticationMiddleware(MiddlewareMixin):
#
#     def process_request(self, request):
#         excluded_paths = ['/login', '/register', '/test']
#         if not any(request.path.startswith(path) for path in excluded_paths):
#             jwt_cookie = request.COOKIES.get('jwt_access')
#             if jwt_cookie:
#                 try:
#                     user = authenticate_user(request)
#                     request.user = user
#                 except AuthenticationFailed:
#                     request.user = AnonymousUser()
#                     logger.debug("Authentication failed, setting user as AnonymousUser")
#             else:
#                 request.user = AnonymousUser()
#                 logger.debug("JWT cookie not found, setting user as AnonymousUser")
#         else:
#             request.user = AnonymousUser()
#             logger.debug("Path is excluded")
