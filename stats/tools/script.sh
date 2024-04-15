#!/bin/bash

if ["$DATABASE" = "postgres" ]
then
    echo "Waiting for postgres..."

    while ! nc -x $DB_HOST $DB_PORT; do
        sleep 0.1
    done

    echo "PostgreSQL started"
fi

# python manage.py flush --no-input
# python manage.py migrate

exec "$@"