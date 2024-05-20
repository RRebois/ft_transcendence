from django.urls import path
from . import views
from .views import *

urlpatterns = [
    path("", views.index, name="index"),
    path('login', login_view.as_view(), name="login"),
    path("register", register_view.as_view(), name="register"),
    path("logout/", views.logout_view, name="logout"),

    # #API Routes
    # path("stats/<str:username>", views.userStatsData, name="userStatsData")
]


# path('register', RegisterView.as_view()),
#     path('login', LoginView.as_view()),
#     path('logout', LogoutView.as_view()),
#     path('user', UpdateUserView.as_view()),
#     path('send_friend', SendFriendRequestView.as_view()),
#     path('accept_friend', AcceptFriendRequestView.as_view()),
#     path('delete_friend', DeleteFriendView.as_view()),
#     path('list_friends', ListFriendsView.as_view()),
#     path('enable_2FA', Enable2FAView.as_view()),
#     path('disable_2FA', Disable2FAView.as_view()),
    # path('decline_friend', DeclineFriendRequestView.as_view()),
