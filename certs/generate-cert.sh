#!/bin/bash
openssl dhparam -out dhparam.pem 4096
openssl req -subj '/CN=localhost' -x509 -nodes -days 365 -newkey rsa:4096 -keyout domain.key -out domain.crt
