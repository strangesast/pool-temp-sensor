FROM debian:9 as build

RUN apt-get update && apt-get install -y \
  build-essential \
  git \
  curl \
  libgflags-dev

WORKDIR /app

RUN git clone -b $(curl -L https://grpc.io/release) https://github.com/grpc/grpc

RUN cd grpc && git submodule update --init --recursive

RUN apt-get install -y \
  build-essential \
  autoconf \
  libtool \
  pkg-config \
  libgflags-dev

RUN cd /app/grpc && make grpc_cli

FROM debian:9

RUN apt-get update && apt-get install -y \
  libgflags-dev

COPY --from=build /app/grpc/bins/opt/ /opt/grpc
COPY certs/domain.crt certs/domain.key /

ENV PATH="/opt/grpc:${PATH}"
