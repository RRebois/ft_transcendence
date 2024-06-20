from django.urls import path
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
    path("edit_data", EditDataView.as_view(), name="editData"),
    # path('send_friend', SendFriendRequestView.as_view(), name='send_friend'),
    # path('accept_friend', AcceptFriendRequestView.as_view(), name='accept_friend'),
    # path('delete_friend', DeleteFriendView.as_view(), name='delete_friend'),
    # path('list_friends', ListFriendsView.as_view(), name='list_friends'),
    path('2FA', Security2FAView.as_view(), name='enable_2FA'),
    path('verifyotp', VerifyOTPView.as_view(), name='verify_otp'),
    # path('disable_2FA', Disable2FAView.as_view(), name='disable_2FA'),
]

