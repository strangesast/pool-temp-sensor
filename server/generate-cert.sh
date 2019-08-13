#!/bin/bash
openssl req -subj '/CN=localhost' -x509 -nodes -days 365 -newkey rsa:4096 -keyout domain.key -out domain.crt
