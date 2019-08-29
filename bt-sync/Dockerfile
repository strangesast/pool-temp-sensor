FROM arm32v7/debian

RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip

RUN python3 -m pip install grpcio grpcio-tools

WORKDIR /app/proto

COPY proto/ .

WORKDIR /app/bt-sync

RUN python3.7 -m grpc_tools.protoc \
  -I=. \
  -I=/app/proto \
  --python_out=. \
  --grpc_python_out=. \
  /app/proto/pooltempsensor.proto

COPY bt-sync/requirements.txt .

RUN pip install -r requirements.txt

COPY bt-sync/ .

CMD ["python3", "main.py"]
