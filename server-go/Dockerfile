FROM golang:1.12 AS build

ENV GO111MODULE=on

WORKDIR /tmp

RUN apt update && apt install -y unzip
RUN wget https://github.com/protocolbuffers/protobuf/releases/download/v3.9.1/protoc-3.9.1-linux-x86_64.zip -O protoc.zip && \
  unzip protoc.zip -d protoc3
RUN mv protoc3/bin/* /usr/local/bin/ && mv protoc3/include/* /usr/local/include/

WORKDIR /app

COPY go.mod go.sum ./

WORKDIR /app/proto

RUN go get -u github.com/golang/protobuf/protoc-gen-go

COPY ./proto/ .

RUN protoc ./pooltempsensor.proto \
  --go_out=plugins=grpc:.

WORKDIR /app/server-go

RUN go mod download

COPY ./server-go/ .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build server.go

FROM gcr.io/distroless/base

COPY --from=build /app/server-go/server /server
COPY ./certs /certs/

#EXPOSE 50051

ENTRYPOINT ["/server"]
