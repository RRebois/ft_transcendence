#!/bin/bash

if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting for postgres..."

    while ! nc -z $SQL_HOST $SQL_PORT; do
        sleep 5
    done

    echo "PostgreSQL started"
fi

# python manage.py flush --no-input
python3 manage.py makemigrations
python3 manage.py migrate --noinput
python3 manage.py collectstatic
python3 manage.py createsuperuser --noinput

exec "$@"