#!/bin/bash
docker build --network=host -t pool-temp-sensor_bt-sync -f bt-sync/Dockerfile .
