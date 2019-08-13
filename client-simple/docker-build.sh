#!/bin/bash
DIR=$(dirname "$(readlink -f "$0")")
PARENT_DIR=$(dirname "$DIR")
source "$PARENT_DIR/config.sh"
FEATURE="client"
docker build --network=host -t "$PERSON"/"$PROJECT"_"$FEATURE" -f "$DIR"/Dockerfile "$PARENT_DIR"
