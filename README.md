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
