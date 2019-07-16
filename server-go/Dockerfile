FROM alpine AS base
RUN apk update
RUN apk add --no-cache curl wget


FROM golang:1.12 AS builder

WORKDIR /app

COPY . .

#RUN go get -d -v ./...
RUN GO111MODULE=on CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build server.go

FROM base

RUN go build server.go
COPY --from=builder /app/server /server

EXPOSE 50051

CMD ["/server"]
