#!/bin/bash
mkdir -p proto
protoc -I /usr/local/include -I ../proto ../proto/pooltempsensor.proto --go_out=plugins=grpc:proto
