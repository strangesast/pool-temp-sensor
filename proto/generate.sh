#!/bin/bash
image=$(docker build --network=host -q -f Dockerfile ..)
container=$(docker create $image)
docker cp $container:proto.tar.gz proto.tar.gz
docker rm -v $container
tar -xf proto.tar.gz
rm proto.tar.gz
