from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path("", views.index, name="index"),
    path("login", login_view.as_view(), name="login"),
    path("register", register_view.as_view(), name="register"),
    path("logout/", logout_view.as_view(), name="logout"),
    # path('user', UpdateUserView.as_view()),
    path('change_password', PasswordChangeView.as_view(), name='change_password'),
    path('reset_password', PasswordResetRequestView.as_view(), name='reset_password'),
    path('change_reset_password/<uidb64>/<token>/', SetNewPasswordView.as_view(), name='change_reset_password'),
    path('reset_password_confirmed/<uidb64>/<token>/', PasswordResetConfirmedView.as_view(), name='reset_confirmed'),
    # path('send_friend', SendFriendRequestView.as_view(), name='send_friend'),
    # path('accept_friend', AcceptFriendRequestView.as_view(), name='accept_friend'),
    # path('delete_friend', DeleteFriendView.as_view(), name='delete_friend'),
    # path('list_friends', ListFriendsView.as_view(), name='list_friends'),
    # path('enable_2FA', Enable2FAView.as_view(), name='enable_2FA'),
    # path('verifyotp', VerifyOTPView.as_view(), name='verifyotp'),
    # path('disable_2FA', Disable2FAView.as_view(), name='disable_2FA'),

    # #API Routes
    # path("Pong/<str:username>", views.userManagementData, name="userManagementData")
]

