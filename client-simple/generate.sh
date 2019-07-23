#!/bin/bash
protoc -I=../proto ../proto/pooltempsensor.proto --js_out=import_style=commonjs:. --grpc-web_out=import_style=commonjs,mode=grpcwebtext:.
