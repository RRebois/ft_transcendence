FROM python:3.12

WORKDIR /usr/src/app

# # similar to python -B (no pyc files to disc)
ENV PYTHONDONTWRITEBYTEODE 1 
# # similar to python -u
ENV PYTHONUNBUFFERED 1

# install dependencies
RUN apt-get update && apt-get install netcat-traditional -y

RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy script to initialize db
COPY ./script.sh /usr/src/app/script.sh
# RUN sed -i 's/\r$//g' /usr/src/app/script.sh
RUN chmod 777 /usr/src/app/script.sh

COPY . .

ENTRYPOINT ["/usr/src/app/script.sh"]