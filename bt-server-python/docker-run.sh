#!/bin/bash
docker run --rm --network=pool-temp-sensor_default -e "GRPC_SERVER=server" strangesast/pool-temp-sensor_bt-server-python
