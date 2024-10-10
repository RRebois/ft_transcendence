from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from django.shortcuts import render, redirect, get_object_or_404
from django.utils.encoding import smart_str, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.urls import reverse
from django.db import IntegrityError
from django.db.models import F
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
                                                               'is_staff', 'is_active']], exclude=['friends'])
    image_url = get_profile_pic_url(user.get_img_url())
    user_dict['image_url'] = image_url
    return user_dict


def get_profile_pic_url(pp_path):
    if not pp_path:
        url = os.environ.get('SERVER_URL')
        full_url = f"{url}/media/profile_pics/default_pp.jpg"
        return full_url
    if pp_path.startswith('http://') or pp_path.startswith('https://'):
        return pp_path
    url = os.environ.get('SERVER_URL')
    if url and url[-1] == '/':
        url = url[:-1]
    if pp_path and pp_path[0] == '/':
        pp_path = pp_path[1:]
    return f"{url}/{pp_path}"


@method_decorator(csrf_protect, name='dispatch')
class UserExistsView(APIView):
    def get(self, request, username):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            user2 = User.objects.get(username=username)
        except:
            return JsonResponse({"message": "User not found"}, status=404)
        return JsonResponse({"message": "found", "user": user2.serialize()}, status=200)


@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            if user.status == "online":
                message = "User already have an active session"
                return JsonResponse(status=401, data={'message': message})

            if user.tfa_activated:
                return JsonResponse({
                    'otp_required': True,
                    'user_id': user.id,
                }, status=status.HTTP_200_OK)

            access_token = serializer.validated_data['jwt_access']
            refresh_token = serializer.validated_data['jwt_refresh']
            user_dict = model_to_dict(user, exclude=['friends'])
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


def exchange_token(code, next=False):
    secret = 'CLIENT42_SECRET_NEXT' if next else 'CLIENT42_SECRET'
    data = {
        "grant_type" : "authorization_code",
        "client_id" : os.environ.get('CLIENT42_ID'),
        "client_secret" : os.environ.get(secret),
        "code" : code,
        "redirect_uri" : os.environ.get('SERVER_URL') + "/login42/redirect",
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
            try:
                user42 = exchange_token(code, next=True)
            except:
                error = login_42_error(request, "The connexion with 42 provider failed")
                return error
        try:
            user = User.objects.get(email=user42["email"])
            if not user.stud42:
                error = login_42_error(request, "Email already taken")
                return error
        except User.DoesNotExist:
            try:
                serializer = self.serializer_class(user42)
                user = serializer.create(data=user42)
            except:
                error = login_42_error(request, "Username already taken")
                return error

        if user.status == "online":
            error = login_42_error(request, "Username already have an active session")
            return error
        token = generate_JWT(user)
        refresh = generate_refresh_JWT(user)
        response = JsonResponse(data={'user': user_as_json(user)}, status=200)
        response.set_cookie(key='jwt_access', value=token, httponly=True)
        response.set_cookie(key='jwt_refresh', value=refresh, httponly=True)
        url = os.environ.get('SERVER')
        response.set_cookie(key='csrftoken', value=get_token(request), samesite='Lax', secure=True)
        response['Location'] = f"{url}:4242/dashboard" if os.environ.get(
            'FRONT_DEV') == '1' else f"{url}:3000/dashboard"
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
        else:
            response = JsonResponse({"redirect": True, "redirect_url": "/"}, status=status.HTTP_401_UNAUTHORIZED)
        return response


# https://www.django-rest-framework.org/api-guide/renderers/#templatehtmlrenderer
@method_decorator(csrf_protect, name='dispatch')
class RegisterView(APIView):
    serializer_class = RegisterSerializer
    img_serializer_class = ProfilePicSerializer

    def post(self, request):
        user_data = request.data
        serializer = self.serializer_class(data=user_data)

        logging.debug("============================ REGISTER VIEW ============================")
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
        logging.debug("serializer_response: ", str(serializer_response))
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
                        profile_img = Avatars.objects.create(image=image, image_url='/media/profile_pics/'+str(image), image_hash_value=md5_hash)
                    else:
                        profile_img = Avatars.objects.get(image_hash_value=md5_hash)
                    profile_img.uploaded_from.add(user)
                    profile_img.save()
                    user.avatar_id = profile_img
                    user.save()
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
            access_token = jwt.encode({'id': user.id}, os.environ.get('SECRET_KEY'), algorithm='HS256')
            refresh_token = jwt.encode({'id': user.id, 'type': 'refresh'}, os.environ.get('SECRET_KEY'),
                                       algorithm='HS256')
            user_dict = model_to_dict(user, exclude=['friends'])
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
class UserStatsDataView(APIView):
    def get(self, request, username):
        try:
            user_stats = UserData.objects.get(user_id=User.objects.get(username=username))
        except User.DoesNotExist:
            return JsonResponse({"message": "User does not exist."}, status=500)
        return JsonResponse(user_stats.serialize())


@method_decorator(csrf_protect, name='dispatch')
class UserGetUsernameView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        return JsonResponse(user.get_username(), safe=False)


@method_decorator(csrf_protect, name='dispatch')
class UserGetIsStudView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        return JsonResponse(user.get_is_stud(), safe=False)


@method_decorator(csrf_protect, name='dispatch')
class UserAvatarView(APIView):
    def get(self, request, username):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        if user.username != username:
            try:
                user_to_check = User.objects.get(username=username)
            except User.DoesNotExist:
                raise Http404("error: User does not exists.")
            return JsonResponse(user_to_check.get_img_url(), safe=False)
        return JsonResponse(user.get_img_url(), safe=False)


@method_decorator(csrf_protect, name='dispatch')
class GetAllUserAvatarsView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        if user.is_superuser:
            return JsonResponse(data={"message": "superuser"}, status=403)
        avatar_list = []
        avatars = Avatars.objects.filter(uploaded_from=user)
        current = Avatars.objects.get(pk=user.avatar_id.pk)

        for avatar in avatars:
            if avatar != current:
                avatar_list.append(avatar)
        return JsonResponse([avatar.serialize() for avatar in avatar_list], safe=False, status=200)


@method_decorator(csrf_protect, name='dispatch')
class UserPersonalInformationView(APIView):
    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise Http404("error: User does not exists.")
        return JsonResponse(user.serialize())


@method_decorator(csrf_protect, name='dispatch')
class UpNewAvatarView(APIView):
    serializer_class = ProfilePicSerializer

    def post(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

        if request.method == 'POST':
            if user.stud42:
                return JsonResponse(data={"message": "A 42 user can't change its avatar"}, status=403)
            if user.is_superuser:
                return JsonResponse(data={"message": "The superuser can't change its avatar"}, status=403)
            if request.FILES:
                image = request.FILES['newAvatar']
                serializer = self.serializer_class(data={'image': image})
                if serializer.is_valid():
                    sha256_hash = hashlib.sha256(image.read()).hexdigest()

                    if Avatars.objects.filter(image_hash_value=sha256_hash).exists():
                        if Avatars.objects.get(image_hash_value=sha256_hash) == Avatars.objects.get(pk=user.avatar_id.pk):
                            return JsonResponse(data={"message": "You already have that same avatar."}, status=400)
                        else:
                            profile_img = Avatars.objects.get(image_hash_value=sha256_hash)
                            profile_img.uploaded_from.add(user)
                            profile_img.save()
                            user.avatar_id = profile_img
                            user.save()
                            return JsonResponse(data={"redirect": True, "redirect_url": "",
                                                      "message": "You have successfully changed your avatar"}, status=200)
                    else:
                        profile_img = Avatars.objects.create(image=image, image_url='/media/profile_pics/'+str(image), image_hash_value=sha256_hash)
                        profile_img.uploaded_from.add(user)
                        profile_img.save()
                        user.avatar_id = profile_img
                        user.save()
                        return JsonResponse(data={"redirect": True, "redirect_url": "",
                                                  "message": "You have successfully uploaded a new avatar"}, status=200)
                else:
                    return JsonResponse(data={"message": "An error occurred. Image format and/or size not valid. "
                                              "Only jpg/jpeg and png images are allowed. "
                                              "Images cannot be larger than "
                                              f"{convert_to_megabyte(FILE_UPLOAD_MAX_MEMORY_SIZE)}MB."}, status=400)
            else:
                return JsonResponse(data={"message": "An error occurred. No new profile pic provided"}, status=400)


@method_decorator(csrf_protect, name='dispatch')
class ChangeAvatarView(APIView):
    def put(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        if user.stud42:
            return JsonResponse(data={"message": "A 42 user can't change its avatar"}, status=403)
        if user.is_superuser:
            return JsonResponse(data={"message": "The superuser can't change its avatar"}, status=403)

        data = request.data
        res = True if "data" in data and data["data"] is not None else False
        if not res:
            return JsonResponse(data={"message": "No avatar selected. Please try again."}, status=400)
        src = data["data"].split("media")
        path = "/media" + src[1]
        print(path)
        try:
            user_avatars = Avatars.objects.filter(uploaded_from=user)
            for avatar in user_avatars:
                print(avatar.serialize()["image"])
                if avatar.serialize()["image"] == path:
                    user.avatar_id = avatar
                    user.save()
                    return JsonResponse(data={"message": "Avatar changed successfully."})
            return JsonResponse(data={"message": "An error occurred. Please try again."})
        except Avatars.DoesNotExist:
            return JsonResponse(data={"message": "An error occurred. Please try again."}, status=500)

class SetPreviousAvatar(APIView):
    def post(self, request):
        data = request.data
        avatar_id = data.get('avatar_id')

        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        if user.stud42:
            return JsonResponse(data={"message": "A 42 user can't change its avatar"}, status=403)
        if user.is_superuser:
            return JsonResponse(data={"message": "The superuser can't change its avatar"}, status=403)

        try:
            avatar = Avatars.objects.filter(uploaded_from=user).get(pk=avatar_id)
            
            user.avatar_id = avatar
            user.save()

            return JsonResponse({
                "message": "Profile picture updated successfully",
                "new_avatar_url": avatar.image.url,
                "redirect": True,
                "redirect_url": "",
            })
        except Avatars.DoesNotExist:
            return JsonResponse({"message": "Avatar not found"}, status=404)
        return JsonResponse({"message": "Invalid request method"}, status=405)

@method_decorator(csrf_protect, name='dispatch')
class EditDataView(APIView):
    serializer_class = EditUserSerializer
    def put(self, request):
        user_data = request.data
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.serializer_class(user, data=user_data, partial=True)
        try:
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
                        'from_image_url': get_profile_pic_url(user.get_img_url()),
                    }
                )
            user_dict = model_to_dict(user, exclude=['friends'])
            image_url = get_profile_pic_url(user.get_img_url())
            user_dict['image_url'] = image_url
            return JsonResponse(data={'user': user_dict}, status=200)
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
class PasswordChangeView(APIView):
    serializer_class = PasswordChangeSerializer

    def put(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = self.serializer_class(data=request.data, context={'user': user})
        if user.stud42:
            return JsonResponse(data={'message': 'You cannot change your password if you are a 42 student'}, status=403)
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
        logging.debug(f"In reset request view")
        try:
            serializer.is_valid(raise_exception=True)
            return JsonResponse(data={'message': 'A mail to reset your password has been sent.'}, status=200)
        except serializers.ValidationError as e:
            error_message = e.detail.get('non_field_errors', [str(e)])[0]
            # logging.debug(f"error: {error}")
            # if str(error).find('ErrorDetail'):
            #     logging.debug(f"In reset request view")
            #     error_message = "Enter a valid email address."
            # else:
            #     error_message = error
            return JsonResponse(data={'message': error_message}, status=400)


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
            return JsonResponse({'message': 'Password reset successfully'}, status=200)
        except serializers.ValidationError as e:
            error_messages = []
            for field, errors in e.detail.items():
                for error in errors:
                    if field == 'non_field_errors':
                        error_messages.append(f"{error}")
                    else:
                        error_messages.append(f"{field}: {error}")
            error_message = " | ".join(error_messages)
            return JsonResponse({'message': error_message}, status=400)


@method_decorator(csrf_protect, name='dispatch')
class PasswordResetConfirmedView(APIView):
    def get(self, request, uidb64, token):
        try:
            user_id = smart_str(urlsafe_base64_decode(uidb64))
            # logging.debug(f"Decoded user_id: {user_id}")
            user = User.objects.get(id=user_id)
            # logging.debug(f"User found: {user.username}")

            if not PasswordResetTokenGenerator().check_token(user, token):
                # logging.debug(f"Invalid or expired reset password token for user {user.username}")
                return JsonResponse({'message': 'Invalid or expired reset password token.'}, status=400)
            # logging.debug(f"Token is valid for user {user.username}")
            return JsonResponse({'token': token, 'uidb64': uidb64}, status=200)

        except DjangoUnicodeDecodeError as identifier:
            return JsonResponse({'message': 'Invalid or expired reset password token.'}, status=400)



@method_decorator(csrf_protect, name='dispatch')
class Security2FAView(APIView):
    def put(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        if user.stud42:
            return JsonResponse(data={'message': 'You cannot enable 2FA if you are a 42 student'}, status=403)
        data = request.data
        value = data.get('value')
        if value:
            try:
                secret_key = pyotp.random_base32()
                user.totp = secret_key
                user.tfa_activated = True
                user.save()
                qr_url = pyotp.totp.TOTP(secret_key).provisioning_uri(user.username)
                return JsonResponse({"qrcode_url": qr_url,
                                     "message": "2FA activated, please scan the QR-code in your authenticator app to save your account code."})
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
        try:
            serializer = VerifyOTPSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            access_token = serializer.validated_data['jwt_access']
            refresh_token = serializer.validated_data['jwt_refresh']
            user_dict = model_to_dict(user, exclude=['friends'])
            image_url = user.get_img_url()
            user_dict['image_url'] = get_profile_pic_url(image_url)
            response = JsonResponse(data={'user': user_dict}, status=200)
            response.set_cookie(key='jwt_access', value=access_token, httponly=True)
            response.set_cookie(key='jwt_refresh', value=refresh_token, httponly=True, samesite='Lax', secure=True)
            response.set_cookie(key='csrftoken', value=get_token(request), samesite='Lax', secure=True)
            return response
        except serializers.ValidationError as e:
            return JsonResponse(data={'message': str(e)}, status=400)


@method_decorator(csrf_protect, name='dispatch')
class SendFriendRequestView(APIView):
    def post(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

        to_username = request.data.get('usernameValue')
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
        notification = Notifications.objects.create(user=to_user, message=f'You have received a new friend request from {user.username}')

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{to_user.id}_group",
            {
                'type': 'friend_request',
                'from_user': user.username,
                'from_user_id': user.id,
                'from_image_url': get_profile_pic_url(user.get_img_url()),
                'to_image_url': get_profile_pic_url(to_user.get_img_url()),
                'to_user': to_user.username,
                'time': str(friend_request.time),
                'request_status': friend_request.status,
                'from_user_status': user.status,
            }
        )
        logging.debug(f"Friend request sent to {to_user.username}")

        message = "Friend request sent."
        return JsonResponse({"message": message, "user": user.serialize(), "level": "success"},
                            status=status.HTTP_200_OK)


@method_decorator(csrf_protect, name='dispatch')
class PendingFriendRequestsView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        friendRequests = (FriendRequest.objects.filter(from_user=user, status='pending')
                          .annotate(to_user_image=F('to_user__avatar_id__image_url'))
                          .values('to_user__username', 'time', 'status', 'to_user_image', 'to_user_id', 'to_user__status')
                          )
        processedRequest = []
        for request in friendRequests:
            # logging.debug(f" img url :  {request['from_user_image']}")
            # from_image_url = request['from_user_image'] or os.environ.get('SERVER_URL') + '/media/profile_pics/default_pp.jpg'
            processedRequest.append({
                'to_user__username': request['to_user__username'],
                'time': request['time'],
                'status': request['status'],
                'to_user_image': (request['to_user_image']),
                'to_image_url': get_profile_pic_url(request['to_user_image']),
                'to_user_id': request['to_user_id'],
                'to_user_status': request['to_user__status'],
            })
        return JsonResponse(processedRequest, safe=False)


class GetFriendRequestView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        friendRequests = (FriendRequest.objects
                          .filter(to_user=user, status='pending')
                          .annotate(from_user_image=F('from_user__avatar_id__image_url'))
                          .values('from_user__username', 'time', 'status', 'from_user_image', 'from_user_id', 'from_user__status'))
        processedRequest = []
        for request in friendRequests:
            logging.debug(f" img url :  {request['from_user_image']}")
            # from_image_url = request['from_user_image'] or os.environ.get('SERVER_URL') + '/media/profile_pics/default_pp.jpg'
            processedRequest.append({
                'from_user__username': request['from_user__username'],
                'time': request['time'],
                'status': request['status'],
                'from_image_url': get_profile_pic_url(request['from_user_image']),
                'from_user_id': request['from_user_id'],
                'from_user_status': request['from_user__status'],
            })
        return JsonResponse(processedRequest, safe=False)


@method_decorator(csrf_protect, name='dispatch')
class AcceptFriendRequestView(APIView):
    def post(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        friend_request_user_id = request.data.get('from_id')
        try:
            friend_request = FriendRequest.objects.get(from_user=friend_request_user_id, to_user=user)
        except FriendRequest.DoesNotExist as e:
            return JsonResponse({"message": str(e), "level": "warning"}, status=500)

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
                'from_user': friend_request.from_user.username,
                'from_user_id': friend_request.from_user.id,
                'from_status': friend_request.from_user.status,
                'from_image_url': get_profile_pic_url(friend_request.from_user.get_img_url()),
                'to_image_url': get_profile_pic_url(user.get_img_url()),
                'to_user': user.username,
                'to_user_id': user.id,
                'to_status': user.status,
                'time': str(friend_request.time),
                'request_status': friend_request.status,
                'size': request.data.get('size'),
            }
        )
        return JsonResponse({"message": "Friend request accepted.", "level": "success", "username": friend_request.from_user.username,
                            "status": friend_request.from_user.status, "img_url": get_profile_pic_url(friend_request.from_user.get_img_url()),
                             "id": friend_request.from_user.id}, status=status.HTTP_200_OK)


class DeclineFriendRequestView(APIView):
    def post(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

        friend_request_user_id = request.data.get('from_id')
        try:
            friend_request = FriendRequest.objects.get(from_user=friend_request_user_id, to_user=user)
        except FriendRequest.DoesNotExist as e:
            return JsonResponse({"message": str(e), "level": "warning"}, status=500)

        if friend_request.to_user != user:
            return JsonResponse({"message": "You cannot decline this friend request.", "level": "warning"},
                                status=status.HTTP_403_FORBIDDEN)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{friend_request.from_user_id}_group",
            {
                'type': 'friend_req_decline',
                'from_user': friend_request.from_user.username,
                'from_user_id': friend_request.from_user.id,
                'to_user': user.username,
                'to_user_id': user.id,
                'request_status': friend_request.status,
                'size': request.data.get('size'),
            }
        )
        friend_request.delete()
        return JsonResponse({"message": "Friend request declined.", "level": "success"}, status=status.HTTP_200_OK)


@method_decorator(csrf_protect, name='dispatch')
class RemoveFriendView(APIView):
    def post(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        friend_id = request.data.get('from_id')
        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist as e:
            return JsonResponse({"message": str(e), "level": "warning"}, status=500)

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
                    'from_image_url': get_profile_pic_url(user.get_img_url()),
                    'to_image_url': get_profile_pic_url(friend.get_img_url()),
                    'to_user': friend.username,
                    'to_user_id': friend.id,
                    # 'time': str(friend_request.time),
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
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        friend_list = user.friends.all()
        serialized_values = [
            {
                'from_user': friend.username,
                'from_user_id': friend.id,
                'from_status': friend.status,
                'from_image_url': get_profile_pic_url(friend.get_img_url()),
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
            # response['Location'] = 'https://localhost:4242/' if os.environ.get("FRONT_DEV") == '1' else 'https://localhost:3000/'
            # response.status_code = 302
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
                        'from_image_url': get_profile_pic_url(user.get_img_url()),
                        'to_image_url': get_profile_pic_url(friend.get_img_url()),
                        'to_user': friend.username,
                        # 'time': str(friend_request.time),
                    }
                )
            response = JsonResponse(data={'message': "Account successfully deleted."}, status=status.HTTP_200_OK)
            response.delete_cookie('jwt_access')
            response.delete_cookie('jwt_refresh')
            # response['Location'] = 'https://localhost:4242/' if os.environ.get("FRONT_DEV") == '1' else 'https://localhost:3000/'
            # response.status_code = 302
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

@method_decorator(csrf_protect, name='dispatch')
class GetNotificationsView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            return JsonResponse(data={'message': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            notifications = Notifications.objects.filter(user=user).order_by('-time')
        except Notifications.DoesNotExist as e:
            return JsonResponse(data={'message': str(e)}, status=404)

        processed_notifications = []
        for notification in notifications:
            processed_notifications.append({
                'message': notification.message,
                'time': notification.time,
                'is_read': notification.is_read,
            })
        return JsonResponse(processed_notifications, safe=False)
