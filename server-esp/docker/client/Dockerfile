from node as build

workdir /build
copy client/package*.json ./
run npm install

copy client/ .
run npm run-script build:prod

from nginx
copy --from=build /build/dist/pool-temp-sensor /usr/share/nginx/html/

copy nginx.conf /etc/nginx/nginx.conf

#cmd ["nginx", "-g", "'daemon off;'"]
