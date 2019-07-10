FROM node:12 as build

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm build

FROM nginx
COPY --from=build /usr/src/app/dist /var/www/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
