FROM python:3-stretch

WORKDIR /app

COPY bt-server-python/requirements.txt .

RUN pip install -r requirements.txt

COPY bt-server-python/ .

COPY certs /certs

CMD ["python3", "/app/main.py"]
