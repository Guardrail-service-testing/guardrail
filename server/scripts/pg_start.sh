#!/bin/bash 

docker run -it --rm --user "$(id -u):$(id -g)" -v /etc/passwd:/etc/passwd:ro --env-file .env -e PGDATA=./postgres/ postgres