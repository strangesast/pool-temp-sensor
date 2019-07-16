#!/bin/bash
protoc -I=../proto ../proto/temp-sensor.proto --js_out=import_style=commonjs:. --grpc-web_out=import_style=commonjs,mode=grpcwebtext:.
