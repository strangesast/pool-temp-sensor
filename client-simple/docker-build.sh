#!/bin/bash
#docker build -t strangesast/pool-temp-sensor_client --build-arg subj="`cat openssl-subj`" .
docker build -t strangesast/pool-temp-sensor_client .
