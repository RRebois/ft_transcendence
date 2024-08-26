FROM node:20.5 AS vite-builder
WORKDIR /app
COPY ./app .
RUN npm install && npm run build

FROM nginx:1.25
RUN apt-get update && apt-get install -y openssl
RUN mkdir -p /etc/nginx/ssl
RUN mkdir -p /app

RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d

COPY --from=vite-builder /app/dist /app
