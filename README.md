# ft_transcendence

## Access the website

http://localhost:8080  
https://localhost:8443

## Makefile commands

| Command        | Description                                                |
|----------------|------------------------------------------------------------|
| `make`         | Start the docker containers and open website               |
| `make up`      | Start the docker containers and open website               |
| `make down`    | Stop the docker containers                                 |
| `make restart` | Restart the docker containers                              |
| `make logs`    | Show the logs of the docker containers                     |
| `make clean`   | Remove the docker containers                               |
| `make fclean`  | Remove the docker containers, images, networks and volumes |
| `make re`      | fclean then up                                             |

## Change ports

If you want to change the ports, you can do it in the following files:

> [!WARNING]
> `80` and `443` ports may require root access.

**docker-compose.yml**

```yml
  nginx:
    build: ./nginx
    container_name: nginx
    volumes:
      - static_volume:/home/stats/web/staticfiles
    ports:
      - 8080:80     # <-- Change the http port here
      - 8443:443    # <-- Change the https port here
    depends_on:
      - web
    restart: on-failure
```

**nginx/nginx.conf**

```nginx configuration
server {
    listen 80;
    server_name localhost;
    return 301 https://$server_name:8443$request_uri;   # <-- Change the http port here
}
```

## Hot reload 🔥

Hot reload is enabled for Django part of the project. Now, you can change the code and see the changes in real time.

> [!NOTE]
> Just don't forget to reload the page in your browser.

## Before push to production

Before pushing the final project, don't forget to:
- set the `DEBUG` variable to `False`
- disable the hot reload

**docker-compose.yml**

```yml
    build: ./stats
    container_name: django_app
#    command: gunicorn configFiles.wsgi:application --bind 0.0.0.0:8000 --reload   # <-- Uncomment this line
    command: python manage.py runserver 0.0.0.0:8000          # Remove this line
```
