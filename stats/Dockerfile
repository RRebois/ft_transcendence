FROM python:3.12

WORKDIR /usr/src/microUserStats

# # similar to python -B (no pyc files to disc)
# ENV PYTHONDONTWRITEBYTEODE 1 
# # similar to python -u
# ENV PYTHONUNBUFFERED 1

# install dependencies
RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy script to initialize db
# COPY ./tools/script.sh /usr/src/microUserStats/script.sh
# # RUN sed -i 's/\r$//g' /usr/src/microUserStats/script.sh
# RUN chmod +x /usr/src/microUserStats/script.sh

COPY . .

# ENTRYPOINT ["/usr/src/microUserStats/script.sh"]