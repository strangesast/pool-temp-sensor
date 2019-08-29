FROM python:3

RUN python3 -m pip install grpcio grpcio-tools
WORKDIR /app/proto
COPY proto/ .
WORKDIR /app/bt-server-python

RUN python3.7 -m grpc_tools.protoc \
  -I=. \
  -I=/app/proto \
  --python_out=. \
  --grpc_python_out=. \
  /app/proto/pooltempsensor.proto

COPY bt-server-python/requirements.txt .

RUN pip install -r requirements.txt

COPY bt-server-python/ .

CMD ["python3", "main.py"]
