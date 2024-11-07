FROM nginx:1.25

RUN apt-get update && apt-get install -y openssl
RUN mkdir -p /etc/nginx/ssl

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
ARG SERVER_IP
RUN sed -i "s/\$SERVER_IP/$SERVER_IP/g" /etc/nginx/conf.d/nginx.conf
