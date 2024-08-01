# Generated by Django 5.0.4 on 2024-07-29 16:46

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Match',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_pong', models.BooleanField(default=True)),
                ('timeMatch', models.DateTimeField(auto_now_add=True)),
                ('count', models.IntegerField(default=2)),
            ],
            options={
                'ordering': ['-timeMatch'],
            },
        ),
        migrations.CreateModel(
            name='Score',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score', models.IntegerField(default=0)),
            ],
        ),
    ]
