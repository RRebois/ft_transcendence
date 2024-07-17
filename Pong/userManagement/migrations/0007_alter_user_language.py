# Generated by Django 5.0.4 on 2024-07-10 08:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userManagement', '0006_remove_user_languages_user_language'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='language',
            field=models.CharField(choices=[('English', 'english'), ('French', 'french'), ('Spanish', 'spanish')], default='English'),
        ),
    ]
