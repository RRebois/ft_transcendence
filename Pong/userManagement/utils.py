from django.core.mail import EmailMessage
from django.conf import settings
from rest_framework import serializers
from datetime import datetime, timedelta, timezone
from PIL import Image
import jwt
import os


def send_email(data):
    email = EmailMessage(
        to=[data['to_email']],
        subject=data['email_subject'],
        body=data['email_body'],
        from_email=settings.EMAIL_HOST_USER,
    )
    email.send()



def get_user_token(id):

    payload = {
            'id': id,
            'exp': datetime.now(timezone.utc) + timedelta(hours=1),  # time before expiration
            'iat': datetime.now(timezone.utc),  # Issued AT
        }
    secret = os.environ.get('SECRET_KEY')
    token = jwt.encode(payload, secret, algorithm='HS256')
    
    return token

def validate_image(image_path):
     
    valid_extension = ['jpg', 'jpeg', 'png', 'gif']
    if not image_path:
        return "profile_pics/default_pp.jpg"
    image = image_path
    ext = os.path.splitext(image.name)[1][1:].lower()

    # checking file extension, that it matches the chosen format
    if ext not in valid_extension:
        raise serializers.ValidationError("Only jpg/jpeg/png/gif and png images are allowed")

    # checking file content, that it matches the format given
    try:
        img = Image.open(image_path)
        if img.format not in ['JPEG', 'PNG', 'GIF']:
            raise serializers.ValidationError("Only jpg/jpeg/png/gif and png images are allowed")
    except Exception as e:
        raise serializers.ValidationError("Only jpg/jpeg/png/gif and png images are allowed")

    return image_path