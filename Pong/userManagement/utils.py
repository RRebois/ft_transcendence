from django.core.mail import EmailMessage
from django.conf import settings


def send_email(data):
    email = EmailMessage(
        to=[data['to_email']],
        subject=data['email_subject'],
        body=data['email_body'],
        from_email=settings.EMAIL_HOST_USER,
    )
    email.send()
