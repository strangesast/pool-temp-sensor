#!/bin/bash
wget https://github.com/protocolbuffers/protobuf/releases/download/v3.9.0/protoc-3.9.0-linux-x86_64.zip
unzip protoc-3.9.0-linux-x86_64.zip -d protoc3

sudo mv protoc3/bin/* /usr/local/bin/

sudo mv protoc3/include/* /usr/local/include/

rm -r protoc3

sudo chown $USER /usr/local/bin/protoc
sudo chown -R $USER /usr/local/include/google
