DOCKER_CONTAINERS	:=	nginx		\
						django_app	\
						postgreSQL

DOCKER_IMAGES		:=	ft_transcendence-nginx	\
						ft_transcendence-web	\
						ft_transcendence-db

DOCKER_VOLUMES		:=	ft_transcendence_media_volume	\
						ft_transcendence_postgres_data	\
						ft_transcendence_static_volume

DOCKER_NETWORKS		:=

all: up

up:
	docker compose up --build -d
#@echo "Opening https://localhost:8443 in browser..."
#@nohup open https://localhost:8443 > /dev/null 2>&1 &

generate_cert:
	openssl req -x509 -nodes -newkey rsa:4096 -out certs/transcendence.crt -keyout certs/transcendence.key -subj "/C=FR/ST=Rhone-Alpes/L=Lyon/O=42/OU=42Lyon/CN=localhost/UID=cbernot"

down:
	docker compose down -v

restart: down up

logs:
	docker compose logs -f

clean: down
	docker rm -f $(DOCKER_CONTAINERS)

fclean: confirm_clean clean clear_migrations
	docker volume rm $(DOCKER_VOLUMES)
	docker rmi $(DOCKER_IMAGES)
	find ./Pong/media/profile_pics/ -type f -not -name 'default_pp.jpg' -delete

clear_migrations:
	@rm -rf ./Pong/userManagement/migrations/0*.py

re: down up

confirm_clean:
	@read -p "Are you sure you want to remove Docker volumes, networks, and images? [y/N] " confirm && if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then echo "Aborted."; exit 1; fi

.PHONY: all up down restart logs clean fclean confirm_clean clear_migrations re
