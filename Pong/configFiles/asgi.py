"""
ASGI config for configFiles project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application

django.setup()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'configFiles.settings')

from channels.routing import ProtocolTypeRouter, URLRouter
from userManagement.middleware import JWTAuthWSMiddleware
from .routing import websocket_urlpatterns

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "https": django_asgi_app,
    "websocket": JWTAuthWSMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    )
    # "websocket": AllowedHostsOriginValidator(
    #          AuthMiddlewareStack(JWTAuthWSMiddleware(
    #     URLRouter(
    #         websocket_urlpatterns
    #     )
    # ))),

})
