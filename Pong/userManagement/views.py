from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.shortcuts import render, redirect, get_object_or_404
from django.utils.encoding import smart_str, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.urls import reverse
from django.db import IntegrityError
from django.contrib import messages
from django.core.files.storage import default_storage
from django.http import Http404, HttpResponse, HttpResponseRedirect, JsonResponse
from configFiles.settings import FILE_UPLOAD_MAX_MEMORY_SIZE
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.views import APIView
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from configFiles.settings import FILE_UPLOAD_MAX_MEMORY_SIZE
from PIL import Image
from django.forms.models import model_to_dict
import pyotp
import hashlib
import jwt
import requests
import os

from .models import *
from .forms import *
from .serializer import *
from .utils import *

import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # This handler writes logs to stdout
    ]
)


@method_decorator(csrf_protect, name='dispatch')
class JWTAuthView(APIView):
    def get(self, request):
        user = authenticate_user(request)
        logging.debug(user)
        if user is not None:
            logging.debug("returning isAuthenticated: True")
            return JsonResponse({'user': user_as_json(user)}, status=200)
        else:
            logging.debug("returning isAuthenticated: False")
            return JsonResponse({'user': None}, status=401)


# @method_decorator(csrf_protect, name='dispatch')
def authenticate_user(request):
    auth_header = request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    if not token:
        token = request.COOKIES.get('jwt_access')
    if not token:
        raise AuthenticationFailed('No JWT were found, please login.')

    secret = os.environ.get('SECRET_KEY')

    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        refresh_token = request.COOKIES.get('jwt_refresh')
        if not refresh_token:
            raise AuthenticationFailed("Access token expired and refresh token not found, please log in again.")
        return refresh_token_user(refresh_token, request)
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Invalid token, please log in again.")

    user_id = payload.get('id')

    try:
        user = User.objects.get(id=user_id)

    except User.DoesNotExist:
        raise AuthenticationFailed('User not found')

    return user


def index(request):
    if request.user.is_authenticated:
        user = request.user
        return render(request, "pages/index.html", {
            "user": user,
        })
    return render(request, "pages/index.html")


class TestView(APIView):
    def get(self, request):
        response = JsonResponse(data={'message': 'healthy'}, status=200)
        response.set_cookie(key='csrftoken', value=get_token(request), samesite='Lax', secure=True, path='/')
        return response


def user_as_json(user):
    user_dict = model_to_dict(user, fields=[field.name for field in user._meta.fields if
                                            field.name not in ['image', 'password', 'last_login', 'is_superuser',
                                                               'is_staff', 'is_active']])
    image_url = get_profile_pic_url(user.get_img_url())
    user_dict['image_url'] = image_url
    return user_dict


@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            if user.status == "online":
                messages.warning(request, "User already have an active session")
                return JsonResponse({
                    'is_authenticated': False,
                    'redirect': True,
                    'redirect_url': ""
                }, status=status.HTTP_401_UNAUTHORIZED)

            if user.tfa_activated:
                return JsonResponse({
                    'otp_required': True,
                    'user_id': user.id,
                }, status=status.HTTP_200_OK)

            access_token = serializer.validated_data['jwt_access']
            refresh_token = serializer.validated_data['jwt_refresh']
            logging.debug("logging user")
            user_dict = model_to_dict(user)
            image_url = user.get_img_url()
            user_dict['image_url'] = get_profile_pic_url(image_url)
            logging.debug("image in logging : " + user_dict['image_url'])

            response = JsonResponse(data={'user': user_dict}, status=200)
            response.set_cookie(key='jwt_access', value=access_token, httponly=True, samesite='Lax', secure=True,
                                path='/')
            response.set_cookie(key='jwt_refresh', value=refresh_token, httponly=True, samesite='Lax', secure=True,
                                path='/')
            response.set_cookie(key='csrftoken', value=get_token(request), samesite='Lax', secure=True, path='/')
            return response
        except AuthenticationFailed as e:
            return JsonResponse(status=401, data={'status': 'false', 'message': str(e)})


@method_decorator(csrf_protect, name='dispatch')
class Login42View(APIView):
    def get(self, request):
        redirect_url = os.environ.get('API_42_CALL')
        return JsonResponse(data={'redirect_url': redirect_url}, status=200)


def exchange_token(code):
    data = {
        "grant_type": "authorization_code",
        "client_id": os.environ.get('CLIENT42_ID'),
        "client_secret": os.environ.get('CLIENT42_SECRET'),
        "code": code,
        "redirect_uri": os.environ.get('REDIRECT_42URI'),
    }
    response = requests.post("https://api.intra.42.fr/oauth/token", data=data)
    credentials = response.json()
    token = credentials['access_token']
    user = requests.get("https://api.intra.42.fr/v2/me", headers={
        "Authorization": f"Bearer {token}"
    }).json()

    return {
        "email": user['email'],
        "username": user['login'],
        "image": user['image']['link'],
        "first_name": user['first_name'],
        "last_name": user['last_name'],
        "language_id": user["languages_users"][0]['language_id'],
    }


@method_decorator(csrf_protect, name='dispatch')
class Login42RedirectView(APIView):
    serializer_class = Register42Serializer

    def post(self, request):
        return HttpResponseRedirect(reverse("index"))

    # TODO: check failure cases
    def get(self, request):
        code = request.GET.get('code')
        try:
            user42 = exchange_token(code)
        except:
            JsonResponse(data={'message': 'The connexion with 42 provider failed'}, status=400)
        try:
            user = User.objects.get(email=user42["email"])
            if not user.stud42:
                return JsonResponse(data={'message': 'email is already taken'}, status=400)
        except User.DoesNotExist:
            try:
                serializer = self.serializer_class(user42)
                user = serializer.create(data=user42)
                user_data = UserData.objects.create(user_id=User.objects.get(pk=user.id))
                user_data.save()
            except:
                JsonResponse(data={'message': 'Username already taken'}, status=400)

        if user.status == "online":
            return JsonResponse(status=401, data={'message': "User already have an active session"})
        token = generate_JWT(user)
        refresh = generate_refresh_JWT(user)
        response = JsonResponse(data={'user': user_as_json(user)}, status=200)
        response.set_cookie(key='jwt_access', value=token, httponly=True)
        response.set_cookie(key='jwt_refresh', value=refresh, httponly=True)
        response.set_cookie(key='csrftoken', value=get_token(request), samesite='Lax', secure=True)
        response['Location'] = 'https://localhost:4242/dashboard'
        response.status_code = 302
        return response


@method_decorator(csrf_protect, name='dispatch')
class LogoutView(APIView):
    def get(self, request):
        user = authenticate_user(request)
        if user is not None:
            response = JsonResponse({"redirect": True, "redirect_url": "/"}, status=status.HTTP_200_OK)
            response.delete_cookie('jwt_access')
            response.delete_cookie('jwt_refresh')
            response.delete_cookie('csrftoken')
        else:
            response = JsonResponse({"redirect": True, "redirect_url": "/"}, status=status.HTTP_401_UNAUTHORIZED)
        return response


def get_profile_pic_url(pp_path):
    if (pp_path.startswith('http://') or pp_path.startswith('https://')):
        return pp_path
    url = os.environ.get('SERVER_URL')
    if url and url[-1] == '/':
        url = url[:-1]
    if pp_path and pp_path[0] == '/':
        pp_path = pp_path[1:]
    return f"{url}/{pp_path}"


# https://www.django-rest-framework.org/api-guide/renderers/#templatehtmlrenderer
@method_decorator(csrf_protect, name='dispatch')
class RegisterView(APIView):
    serializer_class = RegisterSerializer
    img_serializer_class = ProfilePicSerializer

    def post(self, request):
        user_data = request.data
        serializer = self.serializer_class(data=user_data)

        try:
            serializer_response = serializer.is_valid(raise_exception=True)
        except:
            errors = serializer.errors
            for key, value in errors.items():
                for error in value:
                    if key == 'email' and error.code == 'unique':
                        return Response('email already taken', status=400)
                    elif key == 'username' and error.code == 'unique':
                        return Response('username already taken', status=400)
            return Response('Something went wrong', status=400)

        if serializer_response:
            try:
                user = serializer.save()
            except IntegrityError:
                return Response("username or email already taken", status=400)

            default_img = "/profile_pics/default_pp.jpg"
            default_path = "media" + default_img
            with open(default_path, 'rb') as f:
                default_pic_content = f.read()
            md5_hash = hashlib.md5(default_pic_content).hexdigest()

            if 'imageFile' in request.FILES:
                image = request.FILES['imageFile']
                img_serializer = self.img_serializer_class(data={'image': image})
                if img_serializer.is_valid():
                    md5_hash = hashlib.md5(image.read()).hexdigest()

                    # Check if image already uploaded
                    if not Avatars.objects.filter(image_hash_value=md5_hash).exists():
                        profile_img = Avatars.objects.create(image=image, image_hash_value=md5_hash)
                    else:
                        profile_img = Avatars.objects.get(image_hash_value=md5_hash)
                    profile_img.uploaded_from.add(user)
                    profile_img.save()
                    user.avatar_id = profile_img
                    user.save()
                    user_data = UserData.objects.create(user_id=User.objects.get(pk=user.id))
                    user_data.save()
                else:
                    # Check if image already uploaded
                    if not Avatars.objects.filter(image_hash_value=md5_hash).exists():
                        profile_img = Avatars.objects.create(image=default_img, image_hash_value=md5_hash)
                    else:
                        profile_img = Avatars.objects.get(image_hash_value=md5_hash)
                    profile_img.uploaded_from.add(user)
                    profile_img.save()
                    user.avatar_id = profile_img
                    user.save()
                    user_data = UserData.objects.create(user_id=User.objects.get(pk=user.id))
                    user_data.save()
            else:
                # Check if image already uploaded
                if not Avatars.objects.filter(image_hash_value=md5_hash).exists():
                    profile_img = Avatars.objects.create(image=default_img, image_hash_value=md5_hash)
                else:
                    profile_img = Avatars.objects.get(image_hash_value=md5_hash)
                profile_img.uploaded_from.add(user)
                profile_img.save()
                user.avatar_id = profile_img
                user.save()
                user_data = UserData.objects.create(user_id=User.objects.get(pk=user.id))
                user_data.save()
            access_token = jwt.encode({'id': user.id}, os.environ.get('SECRET_KEY'), algorithm='HS256')
            refresh_token = jwt.encode({'id': user.id, 'type': 'refresh'}, os.environ.get('SECRET_KEY'),
                                       algorithm='HS256')
            user_dict = model_to_dict(user)
            image_url = get_profile_pic_url(user.get_img_url())
            logging.debug(f"image_url: {image_url}")
            user_dict['image_url'] = image_url
            logging.debug(f"image_url in dict: {user_dict['image_url']}")
            logging.debug(f"user_dict: {user_dict}")
            response = JsonResponse(data={'user': user_dict}, status=201)
            response.set_cookie(key='jwt_access', value=access_token, httponly=True, samesite='Lax', secure=True,
                                path='/')
            response.set_cookie(key='jwt_refresh', value=refresh_token, httponly=True, samesite='Lax', secure=True,
                                path='/')
            response.set_cookie(key='csrftoken', value=get_token(request), samesite='Lax', secure=True, path='/')
            return response
        else:
            errors = serializer.errors
            logging.debug("serializer validation errors: ", str(errors))
            return Response(str(errors), status=400)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class UserStatsDataView(APIView):
    def get(self, request, username):
        try:
            user_stats = UserData.objects.get(user_id=User.objects.get(username=username))
        except User.DoesNotExist:
            raise Http404("error: User does not exist.")
        except UserData.DoesNotExist:
            raise Http404("error: User data does not exist.")

        return JsonResponse(user_stats.serialize())


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class UserGetUsernameView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        return JsonResponse(user.get_username(), safe=False)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class UserGetIsStudView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        return JsonResponse(user.get_is_stud(), safe=False)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class UserAvatarView(APIView):
    def get(self, request, username):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        if user.username != username:
            try:
                user_to_check = User.objects.get(username=username)
            except User.DoesNotExist:
                raise Http404("error: User does not exists.")
            return JsonResponse(user_to_check.get_img_url(), safe=False)
        return JsonResponse(user.get_img_url(), safe=False)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class GetAllUserAvatarsView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""},
                                status=status.HTTP_401_UNAUTHORIZED)
        avatar_list = []
        avatars = Avatars.objects.filter(uploaded_from=user)
        current = Avatars.objects.get(pk=user.avatar_id.pk)
        for avatar in avatars:
            if avatar != current:
                avatar_list.append(avatar)
        return JsonResponse([avatar.serialize() for avatar in avatar_list], safe=False)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class UserPersonalInformationView(APIView):
    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise Http404("error: User does not exists.")
        return JsonResponse(user.serialize())


@method_decorator(csrf_protect, name='dispatch')
class EditDataView(APIView):
    serializer_class = EditUserSerializer

    def put(self, request):
        logging.debug("================== EditDataView ==================")
        user_data = request.data
        try:
            user = authenticate_user(request)
            logging.debug(f"user: {user}")
        except AuthenticationFailed as e:
            logging.debug(f"AuthenticationFailed: {str(e)}")
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.serializer_class(user, data=user_data, partial=True)
        try:
            logging.debug("serializer.is_valid")
            serializer.is_valid(raise_exception=True)
            serializer.save()
            friend_list = user.friends.all()
            channel_layer = get_channel_layer()
            for friend in friend_list:
                async_to_sync(channel_layer.group_send)(
                    f"user_{friend.id}_group",
                    {
                        'type': 'friend_data_edit',
                        'from_user': user.username,
                        'from_user_id': user.id,
                    }
                )
            user_dict = model_to_dict(user)
            image_url = get_profile_pic_url(user.get_img_url())
            user_dict['image_url'] = image_url
            return JsonResponse(data={'user': user_dict}, status=200)
        except serializers.ValidationError as e:
            logging.debug(f"ValidationError: {str(e)}")
            error_messages = []
            for field, errors in e.detail.items():
                for error in errors:
                    if field == 'non_field_errors':
                        error_messages.append(f"{error}")
                    else:
                        error_messages.append(f"{field}: {error}")
            error_message = " | ".join(error_messages)
            return JsonResponse(data={'message': error_message}, status=400)


@method_decorator(csrf_protect, name='dispatch')
class PasswordChangeView(APIView):
    serializer_class = PasswordChangeSerializer

    def put(self, request):
        logging.debug("================== PasswordChangeView ==================")
        logging.debug(f"request.data: {request.data}")
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = self.serializer_class(data=request.data, context={'user': user})

        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return JsonResponse(data={'message': 'Password changed successfully'}, status=200)
        except serializers.ValidationError as e:
            error_messages = []
            for field, errors in e.detail.items():
                for error in errors:
                    if field == 'non_field_errors':
                        error_messages.append(f"{error}")
                    else:
                        error_messages.append(f"{field}: {error}")
            error_message = " | ".join(error_messages)
            return JsonResponse(data={'message': error_message}, status=400)


@method_decorator(csrf_protect, name='dispatch')
class PasswordResetRequestView(APIView):
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
            response = redirect('index')
            messages.success(request, "A mail to reset your password has been sent.")
            return response
        except serializers.ValidationError as e:
            error_message = e.detail.get('non_field_errors', [str(e)])[0]
            messages.warning(request, error_message)
            return HttpResponseRedirect(reverse("index"))


@method_decorator(csrf_protect, name='dispatch')
class SetNewPasswordView(APIView):
    serializer_class = SetNewPasswordSerializer

    def post(self, request, uidb64, token):
        data = request.data.copy()
        data['uidb64'] = uidb64
        data['token'] = token
        serializer = self.serializer_class(data=data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
            messages.success(request, "Password reset successfully.")
            return HttpResponseRedirect(reverse('index'))
        except serializers.ValidationError as e:
            error_messages = []
            for field, errors in e.detail.items():
                for error in errors:
                    if field == 'non_field_errors':
                        error_messages.append(f"{error}")
                    else:
                        error_messages.append(f"{field}: {error}")
            error_message = " | ".join(error_messages)
            messages.warning(request, error_message)
            return HttpResponseRedirect(reverse('index'))


@method_decorator(csrf_protect, name='dispatch')
class PasswordResetConfirmedView(APIView):
    def get(self, request, uidb64, token):
        try:
            user_id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=user_id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                error_message = "Invalid or expired reset password token."
                messages.warning(request, error_message)
                return HttpResponseRedirect(reverse('index'))
            return render(request, 'pages/passwordReset.html', {'uidb64': uidb64, 'token': token})

        except DjangoUnicodeDecodeError as identifier:
            error_message = "Invalid or expired reset password token."
            messages.warning(request, error_message)
            return HttpResponseRedirect(reverse('index'))


@method_decorator(csrf_protect, name='dispatch')
class Security2FAView(APIView):
    def put(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        data = request.data
        value = data.get('value')
        if value:
            try:
                secret_key = pyotp.random_base32()
                user.totp = secret_key
                user.tfa_activated = True
                user.save()
                qr_url = pyotp.totp.TOTP(secret_key).provisioning_uri(user.username)
                return JsonResponse({"qrcode_url": qr_url, "message": "2FA activated, please scan the QR-code in your authenticator app to save your account code."})
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)
        else:
            try:
                user.totp = None
                user.tfa_activated = False
                user.save()
                return JsonResponse({"message": "2FA successfully deactivated."}, status=200)
            except Exception as e:
                return JsonResponse({"message": str(e)}, status=500)


@method_decorator(csrf_protect, name='dispatch')
class VerifyOTPView(APIView):
    serializer_class = VerifyOTPSerializer

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        access_token = serializer.validated_data['jwt_access']
        refresh_token = serializer.validated_data['jwt_refresh']

        response = JsonResponse({'redirect': reverse('index')}, status=200)
        response.set_cookie(key='jwt_access', value=access_token, httponly=True)
        response.set_cookie(key='jwt_refresh', value=refresh_token, httponly=True, samesite='Lax', secure=True)
        response.set_cookie(key='csrftoken', value=get_token(request), samesite='Lax', secure=True)

        return response

    # def get(self, request):
    #     user_id = request.GET.get('user_id')
    #     serializer = self.serializer_class()
    #     return render(request, "pages/otp.html", {
    #         "user_id": user_id,
    #         "form": serializer
    #     })


@method_decorator(csrf_protect, name='dispatch')
class SendFriendRequestView(APIView):
    def post(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)

        to_username = request.data.get('username')
        try:
            to_user = User.objects.get(username=to_username)
        except User.DoesNotExist:
            message = "User does not exist."
            return JsonResponse({"message": message, "user": to_username, "level": "warning"},
                                status=status.HTTP_403_FORBIDDEN)

        if user == to_user:
            message = "You cannot send a friend request to yourself."
            return JsonResponse({"message": message, "user": user.serialize(), "level": "warning"},
                                status=status.HTTP_403_FORBIDDEN)

        if user.friends.filter(username=to_username).exists():
            message = "This user is already your friend."
            return JsonResponse({"message": message, "user": user.serialize(), "level": "warning"},
                                status=status.HTTP_403_FORBIDDEN)

        if FriendRequest.objects.filter(from_user=user, to_user=to_user).exists():
            message = "Friend request already sent."
            return JsonResponse({"message": message, "user": user.serialize(), "level": "warning"},
                                status=status.HTTP_403_FORBIDDEN)

        if FriendRequest.objects.filter(from_user=to_user, to_user=user, status='pending').exists():
            message = "You have a pending request from this user."
            return JsonResponse({"message": message, "user": user.serialize(), "level": "warning"},
                                status=status.HTTP_403_FORBIDDEN)

        friend_request = FriendRequest.objects.create(from_user=user, to_user=to_user)

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{to_user.id}_group",
            {
                'type': 'friend_request',
                'from_user': user.username,
                'from_user_id': user.id,
                'time': str(friend_request.time),
                'status': friend_request.status
            }
        )

        message = "Friend request sent."
        return JsonResponse({"message": message, "user": user.serialize(), "level": "success"},
                            status=status.HTTP_200_OK)


@method_decorator(csrf_protect, name='dispatch')
class PendingFriendRequestsView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        friendRequests = (FriendRequest.objects.filter(from_user=user, status='pending').
                          values('to_user__username', 'time', 'status', 'to_user_id'))
        return JsonResponse(list(friendRequests), safe=False)


class GetFriendRequestView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        friendRequests = (FriendRequest.objects.filter(to_user=user, status='pending').
                          values('from_user__username', 'time', 'status', 'from_user_id'))
        return JsonResponse(list(friendRequests), safe=False)


@method_decorator(csrf_protect, name='dispatch')
class AcceptFriendRequestView(APIView):
    def post(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        friend_request_user_id = request.data.get('from_id')
        try:
            friend_request = FriendRequest.objects.get(from_user=friend_request_user_id, to_user=user)
        except FriendRequest.DoesNotExist as e:
            return JsonResponse({"message": str(e), "level": "warning"}, status=status.HTTP_400_BAD_REQUEST)

        if friend_request.to_user != user:
            return JsonResponse({"message": "You cannot accept this friend request.", "level": "warning"},
                                status=status.HTTP_403_FORBIDDEN)

        if FriendRequest.objects.filter(from_user_id=friend_request_user_id, to_user_id=user,
                                        status='accepted').exists():
            return JsonResponse({"message": "You already accepted this friend request.", "level": "warning"},
                                status=status.HTTP_400_BAD_REQUEST)

        friend_request.status = 'accepted'
        friend_request.save()

        friend_request.to_user.friends.add(friend_request.from_user)
        friend_request.from_user.friends.add(friend_request.to_user)

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{friend_request.from_user_id}_group",
            {
                'type': 'friend_req_accept',
                'from_user': user.username,
                'from_user_id': user.id,
                'status': friend_request.status
            }
        )
        return JsonResponse({"message": "Friend request accepted.", "level": "success"}, status=status.HTTP_200_OK)


class DeclineFriendRequestView(APIView):
    def post(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)

        friend_request_user_id = request.data.get('from_id')
        try:
            friend_request = FriendRequest.objects.get(from_user=friend_request_user_id, to_user=user)
        except FriendRequest.DoesNotExist as e:
            return JsonResponse({"message": str(e), "level": "warning"}, status=status.HTTP_400_BAD_REQUEST)

        if friend_request.to_user != user:
            return JsonResponse({"message": "You cannot decline this friend request.", "level": "warning"},
                                status=status.HTTP_403_FORBIDDEN)

        friend_request.delete()
        return JsonResponse({"message": "Friend request declined.", "level": "success"}, status=status.HTTP_200_OK)


@method_decorator(csrf_protect, name='dispatch')
class RemoveFriendView(APIView):
    def post(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        friend_id = request.data.get('from_id')
        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist as e:
            return JsonResponse({"message": str(e), "level": "warning"}, status=status.HTTP_400_BAD_REQUEST)

        if friend in user.friends.all():
            user.friends.remove(friend)
            friend.friends.remove(user)

            try:
                friend_request = FriendRequest.objects.get(from_user=friend_id, to_user=user)
                friend_request.delete()
            except FriendRequest.DoesNotExist:
                pass
            try:
                friend_request = FriendRequest.objects.get(from_user=user, to_user=friend_id)
                friend_request.delete()
            except FriendRequest.DoesNotExist:
                pass

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{friend.id}_group",
                {
                    'type': 'friend_remove',
                    'from_user': user.username,
                    'from_user_id': user.id,
                }
            )
            return JsonResponse({"message": "User removed from your friends.", "level": "success"},
                                status=status.HTTP_200_OK)

        return JsonResponse({"message": "User is not in your friends.", "level": "warning"},
                            status=status.HTTP_400_BAD_REQUEST)


class GetFriendView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        friend_list = user.friends.all()
        serialized_values = [
            {
                'username': friend.username,
                'id': friend.id,
                'status': friend.status,
                'image': friend.get_img_url()
            }
            for friend in friend_list
        ]

        return JsonResponse(serialized_values, safe=False)


@method_decorator(csrf_protect, name='dispatch')
class DeleteAccountView(APIView):
    serializer_class = CheckPassword

    def post(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        if user.stud42:
            Avatars.objects.get(pk=user.avatar_id.pk).delete()
            User.objects.get(id=user.id).delete()
            response = JsonResponse(data={'message': "Account successfully deleted."}, status=status.HTTP_200_OK)
            response.delete_cookie('jwt_access')
            response.delete_cookie('jwt_refresh')
            response.delete_cookie('csrftoken')
            response['Location'] = 'https://localhost:4242/'
            response.status_code = 302
            return response

        serializer = self.serializer_class(data=request.data, context={'user': user})
        try:
            serializer.is_valid(raise_exception=True)
            friend_list = list(user.friends.all())
            avatars_uploaded = Avatars.objects.filter(uploaded_from=user)
            for avatar in avatars_uploaded:
                if avatar.uploaded_from.count() == 1:
                    avatar.delete()
            User.objects.get(id=user.id).delete()
            channel_layer = get_channel_layer()
            for friend in friend_list:
                async_to_sync(channel_layer.group_send)(
                    f"user_{friend.id}_group",
                    {
                        'type': 'friend_delete_acc',
                        'from_user': user.username,
                        'from_user_id': user.id,
                    }
                )
            response = JsonResponse(data={'message': "Account successfully deleted."}, status=status.HTTP_200_OK)
            response.delete_cookie('jwt_access')
            response.delete_cookie('jwt_refresh')
            response.delete_cookie('csrftoken')
            response['Location'] = 'https://localhost:4242/dashboard'
            response.status_code = 302
            return response
        except serializers.ValidationError as e:
            error_messages = []
            for field, errors in e.detail.items():
                for error in errors:
                    if field == 'non_field_errors':
                        error_messages.append(f"{error}")
                    else:
                        error_messages.append(f"{field}: {error}")
            error_message = " | ".join(error_messages)
            return JsonResponse(data={'message': error_message}, status=400)
