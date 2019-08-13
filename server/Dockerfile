FROM nginx

WORKDIR /etc/nginx 

COPY ./server/nginx.conf ./certs/domain.crt ./certs/domain.key ./

COPY server/index.html /usr/share/nginx/html/

RUN mkdir -p /etc/nginx/logs

CMD ["nginx", "-g", "daemon off;"]
