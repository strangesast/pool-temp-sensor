# use separate image for holding build dependencies.  keep only compiled
# files in final image
FROM node:12 as build

WORKDIR /tmp

# get protobuf
RUN wget https://github.com/protocolbuffers/protobuf/releases/download/v3.9.1/protoc-3.9.1-linux-x86_64.zip -O protoc.zip && \
  unzip protoc.zip -d protoc3
RUN mv protoc3/bin/* /usr/local/bin/ && mv protoc3/include/* /usr/local/include/

# get web plugin
RUN wget https://github.com/grpc/grpc-web/releases/download/1.0.6/protoc-gen-grpc-web-1.0.6-linux-x86_64 -O protoc-gen-grpc-web && \
  mv protoc-gen-grpc-web /usr/local/bin/protoc-gen-grpc-web && \
  chmod +x /usr/local/bin/protoc-gen-grpc-web

WORKDIR /usr/src/proto

COPY proto/ ./

RUN protoc ./pooltempsensor.proto \
  --js_out=import_style=commonjs:. \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:. \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:.

WORKDIR /usr/src/app

# limit rebuilding from this image layer to when dependencies are updated.
COPY client-simple/package*.json ./
RUN npm install

# copy source js / html template / style files, preserving src folder
COPY client-simple/ ./

# should source compiled proto files from another docker image
#COPY client-simple/webpack.common.js client-simple/webpack.dev.js client-simple/webpack.prod.js ./
RUN npm run-script build

FROM nginx

COPY client-simple/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/dist/ /var/www/
#COPY --from=build /usr/src/app/icons /var/www/icons
CMD ["nginx", "-g", "daemon off;"]
