FROM nginx:1.25

RUN apt-get update && apt-get install -y openssl
RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -newkey rsa:4096 -out /etc/nginx/ssl/transcendence.crt -keyout /etc/nginx/ssl/transcendence.key -subj "/C=FR/ST=Rhone-Alpes/L=Lyon/O=42/OU=42Lyon/CN=localhost/UID=cbernot"
RUN rm /etc/nginx/conf.d/default.conf
COPY conf/ft_transcendence.conf /etc/nginx/conf.d/nginx.conf