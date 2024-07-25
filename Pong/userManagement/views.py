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
from django.http import Http404, HttpResponse, HttpResponseRedirect, JsonResponse
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.views import APIView
import pyotp
import jwt
import requests


from .models import *
from .forms import *
from .serializer import *
from .utils import *


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


@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            if user.tfa_activated:
                return Response({"success": True, "opt_required": True})
                # return JsonResponse({
                #     'otp_required': True,
                #     'user_id': user.id
                # }, status=status.HTTP_200_OK)

            access_token = serializer.validated_data['jwt_access']
            refresh_token = serializer.validated_data['jwt_refresh']
            user.status = 'online'
            user.save()

            response = HttpResponseRedirect(reverse("index"))
            response.set_cookie(key='jwt_access', value=access_token, httponly=True,  samesite='Lax', secure=True, path='/')
            response.set_cookie(key='jwt_refresh', value=refresh_token, httponly=True, samesite='Lax', secure=True, path='/')
            response.set_cookie(key='csrftoken', value=get_token(request), samesite='Lax', secure=True, path='/')
            return response
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return HttpResponseRedirect(reverse("index"))

    def get(self, request):
        return HttpResponseRedirect(reverse("index"))


@method_decorator(csrf_protect, name='dispatch')
class Login42View(APIView):

    def post(self, request):
        return redirect(os.environ.get('API_42_CALL'))

    def get(self, request):
        return redirect(os.environ.get('API_42_CALL'))


def exchange_token(code):
    data = {
        "grant_type" : "authorization_code",
        "client_id" : os.environ.get('CLIENT42_ID'),
        "client_secret" : os.environ.get('CLIENT42_SECRET'),
        "code" : code,
        "redirect_uri" : os.environ.get('REDIRECT_42URI'),
    }
    response = requests.post("https://api.intra.42.fr/oauth/token", data=data)
    credentials = response.json()
    token = credentials['access_token']
    user = requests.get("https://api.intra.42.fr/v2/me", headers={
        "Authorization" : f"Bearer {token}"
    }).json()

    return {
        "email" : user['email'],
        "username" : user['login'],
        "image" : user['image']['link'],
        "first_name" : user['first_name'],
        "last_name" : user['last_name'],
        "language_id" : user["languages_users"][0]['language_id'],
    }


@method_decorator(csrf_protect, name='dispatch')
class Login42RedirectView(APIView):

    serializer_class = Register42Serializer
    def post(self, request):
        return HttpResponseRedirect(reverse("index"))

    def get(self, request):
        code = request.GET.get('code')
        try:
            user42 = exchange_token(code)
        except:
            messages.warning(request, "The connexion with 42 failed")
            return HttpResponseRedirect(reverse("index"))
        try:
            user = User.objects.get(email=user42["email"])
            if not user.stud42:
                messages.warning(request, "e-mail already taken.")
                return HttpResponseRedirect(reverse("index"))
        except User.DoesNotExist:
            try:
                serializer = self.serializer_class(user42)
                user = serializer.create(data=user42)
                user_data = UserData.objects.create(user_id=User.objects.get(pk=user.id))
                user_data.save()
            except:
                messages.warning(request, "Username already taken.")
                return HttpResponseRedirect(reverse("index"))

        user.status = 'online'
        user.save()
        token = generate_JWT(user)
        refresh = generate_refresh_JWT(user)
        response = redirect('index')
        response.set_cookie(key='jwt_access', value=token, httponly=True)
        response.set_cookie(key='jwt_refresh', value=refresh, httponly=True)
        response.set_cookie(key='csrftoken', value=get_token(request), samesite='Lax', secure=True)
        return response


@method_decorator(csrf_protect, name='dispatch')
class LogoutView(APIView):
    def post(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return redirect('index')

        user.status = "offline"
        user.save()

        messages.success(request, "Logged out successfully.")
        response = redirect('index')
        response.delete_cookie('jwt_access')
        response.delete_cookie('jwt_refresh')
        response.delete_cookie('csrftoken')
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
                try:
                    image = validate_image(request.FILES['imageFile'])
                    user.image = image
                    user.save()
                    user_data = UserData.objects.create(user_id=User.objects.get(pk=user.id))
                    user_data.save()
                    messages.success(request, "You have successfully registered.")
                    return HttpResponseRedirect(reverse("index"))

                except :
                    user.image = "profile_pics/default_pp.jpg"
                    user.save()
                    user_data = UserData.objects.create(user_id=User.objects.get(pk=user.id))
                    user_data.save()
                    messages.info(request, "Image format not valid. Profile picture set to default.")
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
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        return JsonResponse(user.get_img_url(), safe=False)


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
@method_decorator(login_required(login_url='login'), name='dispatch')
class EditDataView(APIView):
    serializer_class = EditUserSerializer

    def put(self, request):
        user_data = request.data
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.serializer_class(user, data=user_data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({"success": True})
        except serializers.ValidationError as e:
            error_messages = []
            for field, errors in e.detail.items():
                for error in errors:
                    if field == 'non_field_errors':
                        error_messages.append(f"{error}")
                    else:
                        error_messages.append(f"{field}: {error}")
            error_message = " | ".join(error_messages)
            return Response({"success": False, "errors": error_message})


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class PasswordChangeView(APIView):
    serializer_class = PasswordChangeSerializer

    def put(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = self.serializer_class(data=request.data, context={'user': user})

        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({"success": True})
        except serializers.ValidationError as e:
            error_messages = []
            for field, errors in e.detail.items():
                for error in errors:
                    if field == 'non_field_errors':
                        error_messages.append(f"{error}")
                    else:
                        error_messages.append(f"{field}: {error}")
            error_message = " | ".join(error_messages)
            return Response({"success": False, "errors": error_message})


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
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        value = data.get('value')

        if value:
            try:
                secret_key = pyotp.random_base32()
                user.totp = secret_key
                user.tfa_activated = True
                user.save()

                qr_url = pyotp.totp.TOTP(secret_key).provisioning_uri(user.username)
                message = "2FA activated, please scan the QR-code in authenticator to save your account code."
                return JsonResponse({"qr_url": qr_url, "message": message})
            except Exception as e:
                return Response({"success": False, "error": str(e)}, status=500)
        else:
            try:
                user.totp = None
                user.tfa_activated = False
                user.save()
                message = "2FA successfully deactivated."
                return Response({"success": True, "message": message})
            except Exception as e:
                return Response({"success": False, "error": str(e)}, status=500)


@method_decorator(csrf_protect, name='dispatch')
class VerifyOTPView(APIView):
    serializer_class = VerifyOTPSerializer

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        access_token = serializer.validated_data['jwt_access']
        refresh_token = serializer.validated_data['jwt_refresh']
        user.status = 'online'
        user.save()

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

        FriendRequest.objects.create(from_user=user, to_user=to_user)
        message = "Friend request sent."
        return JsonResponse({"message": message, "user": user.serialize(), "level": "success"}, status=status.HTTP_200_OK)

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

            return JsonResponse({"message": "User removed from your friends.", "level": "success"}, status=status.HTTP_200_OK)

        return JsonResponse({"message": "User is not in your friends.", "level": "warning"}, status=status.HTTP_400_BAD_REQUEST)


class GetFriendView(APIView):
    def get(self, request):
        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        friendList = user.friends.all().values('username', 'id', 'status', 'image')
        return JsonResponse(list(friendList), safe=False)


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(login_required(login_url='login'), name='dispatch')
class DeleteAccountView(APIView):
    serializer_class = CheckPassword

    def post(self, request):

        try:
            user = authenticate_user(request)
        except AuthenticationFailed as e:
            messages.warning(request, str(e))
            return JsonResponse({"redirect": True, "redirect_url": ""}, status=status.HTTP_401_UNAUTHORIZED)
        if user.stud42:
            User.objects.get(id=user.id).delete()
            message = "Account successfully deleted."
            return JsonResponse({"success": True, "redirect": True, "redirect_url": "", "message": message})

        serializer = self.serializer_class(data=request.data, context={'user': user})
        try:
            serializer.is_valid(raise_exception=True)
            User.objects.get(id=user.id).delete()
            message = "Account successfully deleted."
            return JsonResponse({"success": True, "redirect": True, "redirect_url": "", "message": message})
        except serializers.ValidationError as e:
            error_messages = []
            for field, errors in e.detail.items():
                for error in errors:
                    if field == 'non_field_errors':
                        error_messages.append(f"{error}")
                    else:
                        error_messages.append(f"{field}: {error}")
            error_message = " | ".join(error_messages)
            return Response({"success": False, "errors": error_message})
