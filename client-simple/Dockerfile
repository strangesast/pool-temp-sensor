FROM nginx as base
RUN apt-get update
RUN apt-get install -y iputils-ping

WORKDIR /etc/nginx
COPY client-simple/errors.grpc_conf client-simple/ssl.conf client-simple/nginx.conf certs/domain.crt certs/domain.key certs/dhparam.pem ./

FROM node:12 as build

WORKDIR /usr/src/app
COPY client-simple/package*.json ./
RUN npm install

COPY client-simple/src src/
COPY client-simple/pooltempsensor*_pb.js client-simple/webpack.common.js client-simple/webpack.prod.js ./
RUN npm run-script build

COPY client-simple/ .

FROM base
COPY --from=build /usr/src/app/dist/ /usr/src/app/favicon.ico /var/www/
COPY --from=build /usr/src/app/icons /var/www/icons
COPY client-simple/nginx.conf /etc/nginx/nginx.conf
#COPY compression.conf ssl.conf /etc/nginx/

RUN mkdir -p /etc/nginx/logs

#EXPOSE 80
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
