DOCKER_CONTAINERS	:=	nginx		\
				django_app	\
				postgreSQL	\
				frontend	\
				redis

DOCKER_IMAGES		:=	ft_transcendence-nginx	\
				ft_transcendence-web	\
				ft_transcendence-db	\
				ft_transcendence-redis	\
				ft_transcendence-frontend

DOCKER_VOLUMES		:=	ft_transcendence_media_volume	\
				ft_transcendence_postgres_data	\
				ft_transcendence_static_volume

DOCKER_NETWORKS		:=	ft_transcendence_default	\
				ft_transcendence_front

all: up

up:
	docker compose up --build -d
#@echo "Opening https://localhost:8443 in browser..."
#@nohup open https://localhost:8443 > /dev/null 2>&1 &

generate_cert:
	openssl req -x509 -nodes -newkey rsa:4096 -out certs/transcendence.crt -keyout certs/transcendence.key -subj "/C=FR/ST=Rhone-Alpes/L=Lyon/O=42/OU=42Lyon/CN=localhost/UID=cbernot"

cli:
	@if [ -z "$(FILE)" ]; then \
		echo "Error: A file with the SERVER_URL, USERNAME and PASSWORD is expected."; \
		echo "Try 'make cli FILE=<YOUR_FILE>'"; \
		exit 1; \
	elif [ ! -f $(FILE) ]; then \
		echo "Error: File $(FILE) not found."; \
		exit 1; \
	else \
		. $(FILE); \
		NODE_TLS_REJECT_UNAUTHORIZED=0 wscat -c wss://$${SERVER_URL}:8443/ws/api/ -H "username:$${USERNAME}" -H "password:$${PASSWORD}"; \
	fi

down:
	docker compose down -v

restart: down up

logs:
	docker compose logs -f

clean: down

fclean: confirm_clean clean clear_migrations
	find ./Pong/media/profile_pics/ -type f -not -name 'default_pp.jpg' -not -name 'bot.png' -delete

clear_migrations:
	@rm -rf ./Pong/userManagement/migrations/0*.py
	@rm -rf ./Pong/matchs/migrations/0*.py
	@rm -rf ./Pong/anotherGame/migrations/0*.py
	@rm -rf ./Pong/gamesManager/migrations/0*.py

re: down up

confirm_clean:
	@read -p "Are you sure you want to remove Docker volumes, networks, and images? [y/N] " confirm && if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then echo "Aborted."; exit 1; fi

.PHONY: all up down restart logs clean fclean confirm_clean clear_migrations re cli
