#!/usr/bin/env bash
DIR=$(dirname "$(readlink -f "$0")")
PARENT_DIR=$(dirname "$DIR")
source "$PARENT_DIR/config.sh"
FEATURE="bt-server-python"
docker build --network=host -t "$PERSON"/"$PROJECT"_"$FEATURE" -f "$DIR"/Dockerfile "$PARENT_DIR"
