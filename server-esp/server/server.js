const express = require('express');
const http = require('http');
const { Pool, Client } = require('pg');
const WebSocket = require('ws');
const { on } = require('events');
const config = require('config');
const morgan = require('morgan');

const app = express();
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));


const dbConfig = {
  user: config.get('postgres.user'),
  host: config.get('postgres.host'),
  database: config.get('postgres.dbname'),
  password: config.get('postgres.password'),
  port: config.get('postgres.port'),
};

const pool = new Pool(dbConfig);

app.get('/api/latest', async (req, res)  => {
  const result = await pool.query('select distinct on (addr) date, addr, value, sample from raw order by addr, date desc');
  res.json(result.rows);
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server, path: '/ws' });

let client = null;

let connectionCount = 0;
wss.on('connection', async (ws, request) => {
  connectionCount++;
  if (client == null) {
    await start();
  } 

  ws.on('close', () => {
    connectionCount--;
    if (connectionCount == 0) {
      stop();
    }
  });
});

async function start() {
  client = new Client(dbConfig);
  await client.connect();
  client.on('notification', listener);
  client.query('LISTEN new');
}

function stop() {
  client.off('notification', listener);
  client = null;
}

function listener(event) {
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(event.payload);
    }
  });
}

wss.on('close', () => {
  console.log('wss closed');
});

const port = config.get('port');
server.listen(port, () => console.log(`listening on ${port}`));
