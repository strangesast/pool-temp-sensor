#!/bin/bash
mkdir -p proto
protoc -I ../proto ../proto/pooltempsensor.proto --go_out=plugins=grpc:proto
