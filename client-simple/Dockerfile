# use separate image for holding build dependencies.  keep only compiled
# files in final image
FROM node:12 as build
# a place to build
WORKDIR /usr/src/app

FROM pool-temp-sensor_proto-build as proto-build
FROM build
COPY --from=proto-build /usr/src/proto /usr/src/proto
RUN cd /usr/src/proto && npm install

# limit rebuilding from this image layer to when dependencies are updated.
COPY client-simple/package*.json ./
RUN npm install

# copy source js / html template / style files, preserving src folder
COPY client-simple/ ./

# should source compiled proto files from another docker image
COPY client-simple/webpack.common.js client-simple/webpack.dev.js client-simple/webpack.prod.js ./
RUN npm run-script build

#COPY client-simple/ .

FROM nginx
COPY client-simple/nginx.conf /etc/nginx/nginx.conf
# interestingly, from will use the earliest image with matching name so
# '2' is required
COPY --from=2 /usr/src/app/dist/ /var/www/
#COPY --from=build /usr/src/app/icons /var/www/icons
CMD ["nginx", "-g", "daemon off;"]
