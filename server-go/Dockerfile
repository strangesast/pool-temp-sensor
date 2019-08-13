FROM alpine AS base
RUN apk update
RUN apk add --no-cache curl wget

FROM golang:1.12 AS builder

WORKDIR /app

ENV GO111MODULE=on CGO_ENABLED=0 GOOS=linux GOARCH=amd64 

COPY ./server-go/go.mod ./server-go/go.sum ./

RUN go get -d -v ./...

COPY ./server-go/ .

RUN go build server.go

FROM base

COPY --from=builder /app/server /server
COPY ./certs /certs/

EXPOSE 50051

CMD ["/server"]
