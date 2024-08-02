FROM node:20.5 AS vite-builder
WORKDIR /app
COPY ./app .
RUN npm install && npm run build

FROM nginx:1.25
RUN apt-get update && apt-get install -y openssl
RUN mkdir -p /etc/nginx/ssl
RUN mkdir -p /app
RUN openssl req -x509 -nodes -newkey rsa:4096 -out /etc/nginx/ssl/transcendence.crt -keyout /etc/nginx/ssl/transcendence.key -subj "/C=FR/ST=Rhone-Alpes/L=Lyon/O=42/OU=42Lyon/CN=localhost/UID=cbernot"

RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d

COPY --from=vite-builder /app/dist /app
