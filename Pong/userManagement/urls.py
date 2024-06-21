from django.urls import path, include
from . import views
from .views import *

urlpatterns = [
    path("", views.index, name="index"),
    path("login", LoginView.as_view(), name="login"),
    path("login42", Login42View.as_view(), name="login42"),
    path("login42/redirect", Login42RedirectView.as_view()),
    path("register", RegisterView.as_view(), name="register"),
    path("logout/", LogoutView.as_view(), name="logout"),

    path("stats/<str:username>", UserStatsDataView.as_view(), name="userStatsData"),
    path("user/<str:username>/information", UserPersonalInformationView.as_view(), name="infos"),
    path("getUsernameConnected", UserGetUsernameView.as_view(), name="getUsername"),

    # path('user', UpdateUserView.as_view()),
    path('change_password', PasswordChangeView.as_view(), name='change_password'),
    path('reset_password', PasswordResetRequestView.as_view(), name='reset_password'),
    path('change_reset_password/<uidb64>/<token>/', SetNewPasswordView.as_view(), name='change_reset_password'),
    path('reset_password_confirmed/<uidb64>/<token>/', PasswordResetConfirmedView.as_view(), name='reset_confirmed'),
    # path('search_user', SearchUsersView.as_view(), name='search_user'),
    path('send_friend', SendFriendRequestView.as_view(), name='send_friend'),
    path('get_friend_requests', GetFriendRequestView.as_view(), name='get_friend_requests'),
    path('accept_friend', AcceptFriendRequestView.as_view(), name='accept_friend'),
    path('decline_friend', DeclineFriendRequestView.as_view(), name='decline_friend'),
    # path('delete_friend', DeleteFriendView.as_view(), name='delete_friend'),
    # path('list_friends', ListFriendsView.as_view(), name='list_friends'),
    path('enable_2FA', Enable2FAView.as_view(), name='enable_2FA'),
    path('verifyotp', VerifyOTPView.as_view(), name='verify_otp'),
    path('disable_2FA', Disable2FAView.as_view(), name='disable_2FA'),

    # #API Routes
    # path("stats/<str:username>", views.userStatsData, name="userStatsData")
]

