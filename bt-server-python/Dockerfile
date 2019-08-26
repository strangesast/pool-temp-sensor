FROM python:3

#WORKDIR /tmp
#RUN wget https://github.com/protocolbuffers/protobuf/releases/download/v3.9.1/protoc-3.9.1-linux-x86_64.zip -O protoc.zip && \
#  unzip protoc.zip -d protoc3
#RUN mv protoc3/bin/* /usr/local/bin/ && mv protoc3/include/* /usr/local/include/

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
