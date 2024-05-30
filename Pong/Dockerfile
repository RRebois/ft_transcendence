FROM python:3.12


RUN mkdir -p /home/Pong

ENV HOME=/home/Pong
ENV APP_HOME=/home/Pong/web/
RUN mkdir $APP_HOME
RUN mkdir $APP_HOME/staticfiles
WORKDIR $APP_HOME

# # similar to python -B (no pyc files to disc)
ENV PYTHONDONTWRITEBYTEODE 1 
# # similar to python -u
ENV PYTHONUNBUFFERED 1

# install dependencies
RUN apt install
RUN apt-get update && apt-get install netcat-traditional -y

RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy script to initialize db
COPY ./script.sh $APP_HOME/script.sh
RUN sed -i 's/\r$//g' $APP_HOME/script.sh
RUN chmod +x $APP_HOME/script.sh

COPY . $APP_HOME

ENTRYPOINT ["/home/Pong/web/script.sh"]