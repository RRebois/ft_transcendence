from .models import *
from rest_framework import serializers
import re

class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['name']

    def validate_name(self, value):
        if not re.match(r'^[a-zA-Z0-9-_]+$', value):
            raise serializers.ValidationError("Tournament name should contain only alphanumeric or hyphen characters.")

        if not (3 <= len(value) <= 15):
            raise serializers.ValidationError("Tournament name must be between 3 and 15 characters long.")

        if Tournament.objects.filter(name=value).exists():
            raise serializers.ValidationError("A Tournament with this name already exists.")

        return value