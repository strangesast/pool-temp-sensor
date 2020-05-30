from node

workdir /app
copy server/package*.json ./
run npm install
copy server/ .

cmd ["node", "server.js"]
