FROM pool-temp-sensor_proto-build as deps
FROM python:3
RUN pip install --upgrade pip

WORKDIR /app

COPY bt-server-python/requirements.txt .

RUN pip install -r requirements.txt

COPY --from=deps /usr/src/proto/*.py ./

COPY bt-server-python/ /app/

CMD ["python3", "main.py"]
