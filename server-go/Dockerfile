FROM golang:1.12 AS builder

WORKDIR /app

#ENV GO111MODULE=on CGO_ENABLED=0 GOOS=linux GOARCH=amd64 

COPY ./server-go/go.mod ./server-go/go.sum ./

#RUN go get -d -v ./...
RUN go mod download

FROM pool-temp-sensor_proto-build as deps

FROM builder

RUN mkdir proto
COPY --from=deps /usr/src/proto/*.go ./proto/

COPY ./server-go/ .

#RUN go build server.go
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build server.go

#FROM base
FROM gcr.io/distroless/base

COPY --from=2 /app/server /server
COPY ./certs /certs/

#EXPOSE 50051

ENTRYPOINT ["/server"]
