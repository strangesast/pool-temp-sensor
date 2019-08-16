FROM ubuntu:xenial

WORKDIR /tmp

# get dependencies
RUN apt-get update && apt-get install -y \
  curl \
  wget \
  xz-utils \
  build-essential \
  zlib1g-dev \
  libffi-dev \
  unzip \
  git
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y \
  nodejs

RUN wget https://dl.google.com/go/go1.12.9.linux-amd64.tar.gz
RUN tar -C /usr/local -xzf go1.12.9.linux-amd64.tar.gz
ENV PATH="/usr/local/go/bin:/root/go/bin:${PATH}"

RUN wget https://www.python.org/ftp/python/3.7.4/Python-3.7.4.tar.xz
RUN tar -xf Python-3.7.4.tar.xz && \
  cd /tmp/Python-3.7.4/ && \
  ./configure && \
  make && \
  make altinstall

# get protobuf
RUN wget https://github.com/protocolbuffers/protobuf/releases/download/v3.9.0/protoc-3.9.0-linux-x86_64.zip && \
  unzip protoc-3.9.0-linux-x86_64.zip -d protoc3
RUN mv protoc3/bin/* /usr/local/bin/ && mv protoc3/include/* /usr/local/include/

# get plugins
RUN wget https://github.com/grpc/grpc-web/releases/download/1.0.5/protoc-gen-grpc-web-1.0.5-linux-x86_64 && \
  mv protoc-gen-grpc-web-1.0.5-linux-x86_64 /usr/local/bin/protoc-gen-grpc-web && \
  chmod +x /usr/local/bin/protoc-gen-grpc-web

RUN go get -u github.com/golang/protobuf/protoc-gen-go

WORKDIR /usr/src/proto

COPY ./proto/pooltempsensor.proto .

RUN protoc ./pooltempsensor.proto \
  --python_out=. \
  --js_out=import_style=commonjs:. \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:. \
  --go_out=plugins=grpc:.
