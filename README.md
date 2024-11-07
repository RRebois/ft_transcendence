<div align="center">

# ft_transcendence

#### Surprise... It's a game! 🎮

![ft_transcendence](https://github.com/leogaudin/42_project_badges/raw/main/badges/ft_transcendence.webp)

</div>

## About

This is the final project of the 42 Common Core. The goal is to create a website that allows users to play a game of
pong against each other. The website also includes a friend system, a tournament system, and another game.

## Usage

### Requirements

- Docker
- Docker Compose

### Installation

```bash
git clone git@vogsphere.42lyon.fr:vogsphere/intra-uuid-2e746b92-9aa3-4104-b89e-23b1aea8d67e-5784037-rrebois
docker compose up --build
```

> [!IMPORTANT]  
> Before launching the project, please fill the .env file as described below.

### Environment variables

First, copy the `.env.example` file to `.env` and fill the variables.

```bash
cp .env.example .env
```

| Variable                    | Description                                                                                                        |
|-----------------------------|--------------------------------------------------------------------------------------------------------------------|
| `SERVER_IP`                 | IP address of the server                                                                                           |
| `SECRET_KEY`                | Secret key for the application                                                                                     |
| `ALLOWED_HOSTS`             | Hosts allowed to connect                                                                                           |
| `SQL_ENGINE`                | [SQL engine](https://docs.djangoproject.com/en/5.1/ref/databases/#postgresql-notes) to be used (we use postgresql) |
| `SQL_DATABASE`              | Name of the SQL database                                                                                           |
| `SQL_USER`                  | SQL database user                                                                                                  |
| `SQL_PASSWORD`              | Password for the SQL user                                                                                          |
| `SQL_HOST`                  | Host of the SQL database                                                                                           |
| `SQL_PORT`                  | Port of the SQL database (must be the same as in `docker-compose.yml`)                                             |
| `DATABASE`                  | Database configuration                                                                                             |
| `POSTGRES_USER`             | PostgreSQL user                                                                                                    |
| `POSTGRES_PASSWORD`         | Password for the PostgreSQL user                                                                                   |
| `POSTGRES_DB`               | Name of the PostgreSQL database                                                                                    |
| `DJANGO_SUPERUSER_USERNAME` | Django superuser username                                                                                          |
| `DJANGO_SUPERUSER_PASSWORD` | Django superuser password                                                                                          |
| `DJANGO_SUPERUSER_EMAIL`    | Django superuser email                                                                                             |
| `TOTP_SECRET_KEY`           | TOTP secret key                                                                                                    |
| `REFRESH_SECRET_KEY`        | Refresh secret key                                                                                                 |
| `EMAIL_SENDER`              | Email sender address                                                                                               |
| `EMAIL_SENDER_PASS`         | Password for the email sender                                                                                      |
| `SERVER`                    | `https://$SERVER_IP`                                                                                               |
| `SERVER_URL`                | `$SERVER:8443` (port must be the same as in `docker-compose.yml`)                                                  |
| `API_42_CALL_LOCALHOST`     | 42 provider redirect uri for localhost                                                                             |
| `API_42_CALL_(ip_address)`  | 42 provider redirect uri for specific IP address                                                                   |
| `CLIENT42_ID`               | Client ID for 42 API                                                                                               |
| `CLIENT42_SECRET`           | Client secret for 42 API                                                                                           |
| `CLIENT42_SECRET_NEXT`      | Next client secret for 42 API                                                                                      |
| `FRONT_DEV`                 | `0`                                                                                                                |

> [!NOTE]  
> To get the `CLIENT42_ID` and `CLIENT42_SECRET`, you need to create an application on the 42 API [here](https://profile.intra.42.fr/oauth/applications/new).


## Access the website

Once credentials are filled, and containers are running, you can access the website at the following URLs:
- Frontend: https://your_serveur_url:3000  
- Backend admin tool: https://your_serveur_url:8443/admin

## Authors

| Author                    | GitHub profile                                     |
|---------------------------|----------------------------------------------------|
| Tanguy Gellon (tgellon)   | [@tang1304](https://github.com/tang1304)           |
| Rolando Rebois (rrebois)  | [@RRebois](https://github.com/RRebois)             |
| Felipe Belfort (fbelfort) | [@FelipeBelfort](https://github.com/FelipeBelfort) |
| Camille Bernot (cbernot)  | [@RhesusP](https://github.com/RhesusP)             | 