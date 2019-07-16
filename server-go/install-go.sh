#!/bin/bash
wget https://dl.google.com/go/go$VERSION.$OS-$ARCH.tar.gz
tar -C /usr/local -xzf go$VERSION.$OS-$ARCH.tar.gz
# add to global /etc/profile
#export PATH=$PATH:/usr/local/go/bin
# add to local $HOME/.profile
#export GOPATH=$HOME/go
#export GO111MODULE=on
