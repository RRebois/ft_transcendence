from io import BytesIO
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.shortcuts import render, redirect
from django.core.exceptions import ObjectDoesNotExist
from django.utils.encoding import smart_str, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse
from django.db import IntegrityError
from django.contrib import messages
from django.http import Http404, HttpResponse, HttpResponseRedirect, JsonResponse
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.views import APIView
import pyotp
import qrcode
import jwt

from .models import *
from .forms import *
from .serializer import *


# @method_decorator(csrf_protect, name='dispatch')
def authenticate_user(request):
    token = request.COOKIES.get('jwt')
    if not token:
        raise AuthenticationFailed('Unauthenticated')

    secret = os.environ.get('SECRET_KEY')

    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        # print("Payload:", payload)
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token expired, please log in again.")
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Invalid token, please log in again.")

    user_id = payload.get('id')
    print("User ID:", user_id)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise AuthenticationFailed('User not found')

    return user

# @method_decorator(csrf_protect, name='dispatch')
def index(request):
    if request.user.is_authenticated:
        user = request.user
        return render(request, "pages/index.html", {
            "user": user,
        })
    return render(request, "pages/index.html")


@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    serializer_class = LoginSerializer
    def post(self, request):
        user_data = request.data
        serializer = self.serializer_class(data=request.data, context={'request': request})

        if serializer.is_valid():
            user = serializer.validated_data['user']
            if user.tfa_activated:
                return JsonResponse({
                    'otp_required': True,
                    'user_id': user.id
                }, status=status.HTTP_200_OK)

            token = serializer.validated_data['token']
            user.status = 'online'
            user.save()

            response = JsonResponse({'redirect': reverse('index')}, status=200)
            response.set_cookie(key='jwt', value=token, httponly=True)
            response.set_cookie(key='csrftoken', value=get_token(request), samesite='Lax', secure=True)
            login(request, user)
            return response
        else:
            return HttpResponseRedirect(reverse("index"))

    def get(self, request):
        return HttpResponseRedirect(reverse("index"))


@method_decorator(csrf_protect, name='dispatch')
class LogoutView(APIView):
    def post(self, request):
        user = authenticate_user(request)

        user.status = "offline"
        user.save()

        messages.success(request, "Logged out successfully.")
        response = redirect('index')
        response.delete_cookie('jwt')
        response.delete_cookie('csrftoken')
        logout(request)
        return response


# https://www.django-rest-framework.org/api-guide/renderers/#templatehtmlrenderer
@method_decorator(csrf_protect, name='dispatch')
class RegisterView(APIView):
    serializer_class = RegisterSerializer
    def post(self, request):
        user_data = request.data
        serializer = self.serializer_class(data=user_data)
        if serializer.is_valid():
            try:
                user = serializer.save()
            except IntegrityError:
                messages.error(request, "Username and/or email already taken.")
                return render(request, "pages/register.html")

            if 'imageFile' in request.FILES:
                image = request.FILES['imageFile']
                valid_extension = ['jpg', 'jpeg', 'png', 'gif']
                ext = os.path.splitext(image.name)[1][1:].lower()
                if ext not in valid_extension:
                    user.image = "profile_pics/default_pp.jpg"
                    user.save()
                    user_data = UserData.objects.create(user_id=User.objects.get(pk=user.id))
                    user_data.save()
                    messages.info(request, "Image extension not valid. Profile picture set to default.")
                    messages.success(request, "You have successfully registered.")
                    return HttpResponseRedirect(reverse("index"))

            # checking file content, that it matches the format given
                img = Image.open(image)
                if img.format not in ['JPEG', 'PNG', 'GIF']:
                    user.image = "profile_pics/default_pp.jpg"
                    user.save()
                    user_data = UserData.objects.create(user_id=User.objects.get(pk=user.id))
                    user_data.save()
                    messages.info(request, "Image format not valid. Profile picture set to default.")
                    messages.success(request, "You have successfully registered.")
                    return HttpResponseRedirect(reverse("index"))

                user.image = image
                user.save()
                user_data = UserData.objects.create(user_id=User.objects.get(pk=user.id))
                user_data.save()
                messages.success(request, "You have successfully registered.")
                return HttpResponseRedirect(reverse("index"))
            else:
                user.image = "profile_pics/default_pp.jpg"
                user.save()
                user_data = UserData.objects.create(user_id=User.objects.get(pk=user.id))
                user_data.save()
                messages.info(request, "No profile image selected. Profile picture set to default.")
                messages.success(request, "You have successfully registered.")
                return HttpResponseRedirect(reverse("index"))

        return render(request, "pages/register.html", {
            "form": serializer,
            "errors": serializer.errors
        })

    def get(self, request):
        serializer = self.serializer_class()
        return render(request, "pages/register.html", {
            "form": serializer
        })

@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class UserStatsDataView(APIView):

    def get(self, request, username):
        try:
            user_stats = UserData.objects.get(user_id=User.objects.get(username=username))
        except User.DoesNotExist:
            raise Http404("error: User does not exists.")
        except UserData.DoesNotExist:
            raise Http404("error: User data does not exists.")

        return JsonResponse(user_stats.serialize())



# @method_decorator(csrf_protect, name='dispatch')
# class UpdateUserView(APIView):
#     serializer_class = UserSerializer
#     def put(self, request):
#         user = authenticate_user(request)
#
#         serializer = self.serializer_class(user, data=request.data, partial=True)
#         if serializer.is_valid(raise_exception=True):
#             serializer.save()
#             return Response({"detail": "Data changed successfully"},
#                             status=status.HTTP_200_OK)
#         return Response(serializer.errors, status=status.HTTP_403_FORBIDDEN)
#
#
@method_decorator(csrf_protect, name='dispatch')
class PasswordChangeView(APIView):
    serializer_class = PasswordChangeSerializer
    def post(self, request):
        user = authenticate_user(request)
        serializer = self.serializer_class(data=request.data, context={'user': user})
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            response = redirect('index')
            messages.success(request, "Your password has been changed.")
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        serializer = self.serializer_class()
        return render(request, "pages/changePassword.html", {
            "form": serializer
        })


@method_decorator(csrf_protect, name='dispatch')
class PasswordResetRequestView(APIView):
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        response = redirect('index')
        messages.success(request, "A mail to reset your password has been sent.")
        return response

    def get(self, request):
        serializer = self.serializer_class()
        return render(request, "pages/forgotPassword.html", {
            "form": serializer
        })


@method_decorator(csrf_protect, name='dispatch')
class SetNewPasswordView(APIView):
    serializer_class = SetNewPasswordSerializer

    def post(self, request, uidb64, token):
        data = request.data.copy()
        data['uidb64'] = uidb64
        data['token'] = token
        serializer = self.serializer_class(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        messages.success(request, "Password reset successfully.")
        return HttpResponseRedirect(reverse('index'))


class PasswordResetConfirmedView(APIView):
    def get(self, request, uidb64, token):
        try:
            user_id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=user_id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'detail': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
            return render(request, 'pages/passwordReset.html', {'uidb64': uidb64, 'token': token})

        except DjangoUnicodeDecodeError as identifier:
            return Response({'detail': 'Token invalid or expired.'}, status=status.HTTP_401_UNAUTHORIZED)


@method_decorator(csrf_protect, name='dispatch')
class Enable2FAView(APIView):
    def post(self, request):
        user = authenticate_user(request)

        if user.tfa_activated is True:
            messages.success(request, "2FA already activated.")
            response = redirect('index')
            return response
        secret_key = pyotp.random_base32()
        user.totp = secret_key
        user.tfa_activated = True
        user.save()

        qr_url = pyotp.totp.TOTP(secret_key).provisioning_uri(user.username)
        message = "2FA activated, please scan the QR-code in authenticator to save your account code."
        return JsonResponse({"qr_url": qr_url, "message": message})

    def get(self, request):
        return render(request, "pages/2FA.html")

@method_decorator(csrf_protect, name='dispatch')
class VerifyOTPView(APIView):
    serializer_class = VerifyOTPSerializer
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        user = serializer.validated_data['user']

        user.status = 'online'
        user.save()

        login(request, user)
        # response = Response({"token": token})
        response = redirect('index')
        response.set_cookie(key='jwt', value=token, httponly=True)
        return response

    def get(self, request):
        user_id = request.GET.get('user_id')
        serializer = self.serializer_class()
        return render(request, "pages/otp.html", {
            "user_id": user_id,
            "form": serializer
        })


@method_decorator(csrf_protect, name='dispatch')
class Disable2FAView(APIView):
    def post(self, request):
        user = authenticate_user(request)

        if user.tfa_activated is False:
            messages.success(request, "2FA already deactivated.")
            response = redirect('index')
            return response
        user.totp = None
        user.tfa_activated = False
        user.save()
        messages.success(request, "2FA deactivated.")
        response = redirect('index')
        return response


# @method_decorator(csrf_protect, name='dispatch')
# class SendFriendRequestView(APIView):
#     def post(self, request):
#         user = authenticate_user(request)
#         to_user_id = request.data.get('to_id')
#
#         try:
#             to_user = User.objects.get(pk=to_user_id)
#         except User.DoesNotExist:
#             return Response({'detail': 'User does not exist.'}, status=status.HTTP_404_NOT_FOUND)
#
#         if user == to_user:
#             return Response({'detail': 'You cannot send a friend request to yourself.'},
#                             status=status.HTTP_400_BAD_REQUEST)
#
#         if user.friends.filter(id=to_user_id).exists():
#             return Response({'detail': 'This user is already your friend.'}, status=status.HTTP_400_BAD_REQUEST)
#
#         if FriendRequest.objects.filter(from_user=user, to_user=to_user).exists():
#             return Response({'detail': 'Friend request already sent.'}, status=status.HTTP_400_BAD_REQUEST)
#
#         if FriendRequest.objects.filter(from_user=to_user, to_user=user, status='pending').exists():
#             return Response({'detail': 'You have a pending request from this user.'},
#                             status=status.HTTP_400_BAD_REQUEST)
#
#         FriendRequest.objects.create(from_user=user, to_user=to_user)
#         return Response({'detail': 'Friend request sent.'}, status=status.HTTP_201_CREATED)
#
#
# @method_decorator(csrf_protect, name='dispatch')
# class AcceptFriendRequestView(APIView):
#     def post(self, request):
#         user = authenticate_user(request)
#         friend_request_user_id = request.data.get('from_id')
#         try:
#             friend_request = FriendRequest.objects.get(from_user_id=friend_request_user_id, to_user_id=user)
#         except FriendRequest.DoesNotExist:
#             return Response({'detail': 'Friend request does not exist.'}, status=status.HTTP_404_NOT_FOUND)
#
#         if friend_request.to_user != user:
#             return Response({'detail': 'You cannot accept this friend request.'}, status=status.HTTP_403_FORBIDDEN)
#
#         if FriendRequest.objects.filter(from_user_id=friend_request_user_id, to_user_id=user,
#                                         status='accepted').exists():
#             return Response({'detail': 'You already accepted this friend request.'}, status=status.HTTP_403_FORBIDDEN)
#
#         friend_request.status = 'accepted'
#         friend_request.save()
#
#         friend_request.to_user.friends.add(friend_request.from_user)
#         friend_request.from_user.friends.add(friend_request.to_user)
#
#         return Response({'detail': 'Friend request accepted.'}, status=status.HTTP_200_OK)
#
# # TODO: If necessary, otherwise we stay with pending requests
# # class DeclineFriendRequestView(APIView):
# #     def post(self, request):
# #         token = request.COOKIES.get('jwt')
# #         if not token:
# #             raise AuthenticationFailed('Unauthenticated')
# #         friend_request_id = request.data.get('friend_request_id')
# #         try:
# #             friend_request = FriendRequest.objects.get(pk=friend_request_id)
# #         except FriendRequest.DoesNotExist:
# #             return Response({'detail': 'Friend request does not exist.'}, status=status.HTTP_404_NOT_FOUND)
# #
# #         if friend_request.to_user != request.user:
# #             return Response({'detail': 'You cannot decline this friend request.'}, status=status.HTTP_403_FORBIDDEN)
# #
# #         friend_request.delete()
# #
# #         return Response({'detail': 'Friend request declined.'}, status=status.HTTP_200_OK)
#
#
# @method_decorator(csrf_protect, name='dispatch')
# class DeleteFriendView(APIView):
#     def post(self, request):
#         user = authenticate_user(request)
#         friend_id = request.data.get('to_id')
#         try:
#             friend = User.objects.get(id=friend_id)
#         except User.DoesNotExist:
#             return Response({'detail': 'Friend does not exist.'}, status=status.HTTP_404_NOT_FOUND)
#
#         if friend in user.friends.all():
#             user.friends.remove(friend)
#             friend.friends.remove(user)
#
#             try:
#                 friend_request = FriendRequest.objects.get(from_user_id=friend_id, to_user_id=user)
#                 friend_request.delete()
#             except FriendRequest.DoesNotExist:
#                 pass
#             try:
#                 friend_request = FriendRequest.objects.get(from_user_id=user, to_user_id=friend_id)
#                 friend_request.delete()
#             except FriendRequest.DoesNotExist:
#                 pass
#
#             return Response({'detail': 'Friend removed.'}, status=status.HTTP_200_OK)
#
#         return Response({'detail': 'User is not in your friends.'}, status=status.HTTP_400_BAD_REQUEST)
#
#
# @method_decorator(csrf_protect, name='dispatch')
# class ListFriendsView(APIView):
#     def post(self, request):
#         user = authenticate_user(request)
#         friends = user.friends.all()
#         friends_data = []
#         if friends:
#             for friend in friends:
#                 friends_data.append({
#                     'username': friend.username,
#                     'status': friend.status,
#                 })
#             return Response(friends_data, status=status.HTTP_200_OK)
#         else:
#             return Response({'detail': 'No friends yet.'}, status=status.HTTP_200_OK)
