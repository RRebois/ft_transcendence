#!/bin/bash

echo "Database: $DATABASE"
if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting for postgres..."

    while ! nc -z $SQL_HOST $SQL_PORT; do
        sleep 0.1
    done

    echo "PostgreSQL started"
fi

python manage.py flush --no-input
python manage.py makemessages -l "es"
python manage.py makemigrations
python manage.py migrate --noinput
python manage.py collectstatic
python manage.py createsuperuser --noinput
echo "---------------------------------- DONE ---------------------------------"
exec "$@"