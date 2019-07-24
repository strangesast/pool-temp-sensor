FROM nginx as base

RUN apt-get update && apt-get install -y openssl

RUN openssl dhparam -out /etc/nginx/dhparam.pem 4096

ARG subj

RUN openssl req \
  -x509 \
  -nodes \
  -days 365 \
  -newkey rsa:2048 \
  -subj "$subj" \
  -keyout /etc/ssl/private/selfsigned.key \
  -out /etc/ssl/certs/selfsigned.crt

FROM node:12 as build

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY src src/
COPY pooltempsensor*_pb.js webpack.common.js webpack.prod.js ./
RUN npm run-script build

COPY . .

FROM base
COPY --from=build /usr/src/app/dist/ /usr/src/app/favicon.ico /var/www/
COPY --from=build /usr/src/app/icons /var/www/icons
COPY nginx.conf /etc/nginx/nginx.conf
COPY compression.conf ssl.conf /etc/nginx/

RUN mkdir -p /etc/nginx/logs

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
