#!/bin/bash
image=$(docker build -f Dockerfile -q ..)
id=$(docker create $image)
docker cp $id:/usr/src/proto/ ./build
docker rm -v $id
