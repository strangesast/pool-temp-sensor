#!/bin/bash
docker run --rm --network=host strangesast/pool-temp-sensor_server-go
#docker run --network="container:mongo" --rm strangesast/pool-temp-sensor_server-go
#docker run --rm --expose 50051 strangesast/pool-temp-sensor_server-go
