from django.urls import path, include, re_path
from . import views
from .views import *

urlpatterns = [
    path("", views.index, name="index"),
    path("login", LoginView.as_view(), name="login"),
    path("login42", Login42View.as_view(), name="login42"),
    path("login42/redirect", Login42RedirectView.as_view()),
    path("register", RegisterView.as_view(), name="register"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("test/", TestView.as_view(), name="test"),
    path("check_jwt", JWTAuthView.as_view(), name="check_jwt"),

    path("stats/<str:username>", UserStatsDataView.as_view(), name="userStatsData"),
    path("user/<str:username>/information", UserPersonalInformationView.as_view(), name="infos"),
    path("getUsernameConnected", UserGetUsernameView.as_view(), name="getUsername"),
    path("getStudStatus", UserGetIsStudView.as_view(), name="getIsStud"),
    path("getUserAvatar/<str:username>", UserAvatarView.as_view(), name="getAvatar"),
    path("getAllTimeUserAvatars", GetAllUserAvatarsView.as_view(), name="getAllAvatars"),


    path('change_password', PasswordChangeView.as_view(), name='change_password'),
    path('reset_password', PasswordResetRequestView.as_view(), name='reset_password'),
    path('change_reset_password/<uidb64>/<token>/', SetNewPasswordView.as_view(), name='change_reset_password'),
    path('reset_password_confirmed/<uidb64>/<token>/', PasswordResetConfirmedView.as_view(), name='reset_confirmed'),
    path("edit_data", EditDataView.as_view(), name="editData"),

    path('send_friend', SendFriendRequestView.as_view(), name='send_friend'),
    path("pending_friend_requests", PendingFriendRequestsView.as_view(), name="pending"),
    path('get_friend_requests', GetFriendRequestView.as_view(), name='get_friend_requests'),
    path('accept_friend', AcceptFriendRequestView.as_view(), name='accept_friend'),
    path('decline_friend', DeclineFriendRequestView.as_view(), name='decline_friend'),
    path('get_friends', GetFriendView.as_view(), name='get_friends'),
    path('remove_friend', RemoveFriendView.as_view(), name='remove_friend'),
    path('2FA', Security2FAView.as_view(), name='enable_2FA'),
    path('verifyotp', VerifyOTPView.as_view(), name='verify_otp'),
    path("delete_account", DeleteAccountView.as_view(), name="delete"),
    path('get_ws_token/', views.get_ws_token, name='get_ws_token'),
]

