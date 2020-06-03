const express = require('express');
const http = require('http');
const { Pool, Client } = require('pg');
const WebSocket = require('ws');
const { on } = require('events');
const config = require('config');
const morgan = require('morgan');

const app = express();
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// const result = await pool.query(`select array_agg(t) as result from generate_series($1::timestamp, $2::timestamp, '1 minutes') t`, [date, now]);
app.get('/api/data', async (req, res, next) => {
  try {
    const from = req.query && req.query.from;

    const minutes = tryParseNumber(req.query.minutes);
    const hours = tryParseNumber(req.query.hours);
    const seconds = tryParseNumber(req.query.seconds);
    const milliseconds = tryParseNumber(req.query.milliseconds);

    const minDate = new Date(from).toISOString();
    const result = await pool.query('select * from raw where date > $1 order by date asc', [minDate]);

    res.json(bucket(result.rows, {hours, minutes, seconds, milliseconds}));
  } catch (err) {
    next(err);
  }
});

function tryParseNumber(str, def = 0) {
  let num = NaN;
  try {
    num = parseInt(str, 10);
  } catch (err) {
    // pass
  }
  return !isNaN(num) ? num : 0;
}

app.get('/api/minute', async (req, res, next) => {
  const result = await pool.query('select * from raw order by date asc');
  let date;
  const buckets = [];
  let bucket;
  let i = 0;
  for (const row of result.rows) {
    if (date == null) {
      date = new Date(row.date);
      date.setHours(date.getHours(), Math.ceil(date.getMinutes() / 4) * 4, 0, 0);
      bucket = [];
      buckets.push(bucket);
    }
    while (row.date > date) {
      buckets[i] = buckets[i].length > 0 ? buckets[i].reduce((a, b) => a + b, 0) / buckets[i].length : 0;
      date.setMinutes(date.getMinutes() + 15);
      bucket = [];
      buckets.push(bucket);
      i++;
    }
    bucket.push(row.value);
  }
  buckets[i] = buckets[i].length > 0 ? buckets[i].reduce((a, b) => a + b, 0) / buckets[i].length : 0;
  res.json(normalize(buckets));
});

function bucket(rows, {hours, minutes, seconds, milliseconds} = {hours: 0, minutes: 0, seconds: 0, milliseconds: 0}) {
  if ([hours, minutes, seconds, milliseconds].every(v => v == 0)) {
    throw new Error('all offset values cannot be zero');
  }
  let date;
  const buckets = [];
  let bucket;
  let i = 0;
  for (const row of rows) {
    if (date == null) {
      date = new Date(row.date);
      if (minutes) {
        date.setHours(date.getHours(), Math.floor(date.getMinutes() / minutes) * minutes, seconds ? date.getSeconds() : 0, 0);
      }
      if (seconds) {
        date.setHours(date.getHours(), date.getMinutes(), Math.floor(date.getSeconds() / seconds) * seconds, 0);
      }
      // date.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
      bucket = {};
      buckets.push({date: new Date(date), value: bucket});
    }
    while (row.date > date) {
      date.setHours(
        date.getHours() + hours,
        date.getMinutes() + minutes,
        date.getSeconds() + seconds,
        date.getMilliseconds() + milliseconds,
      );
      bucket = {};
      buckets.push({date: new Date(date), value: bucket});
      i++;
    }
    if (bucket[row.addr] == null) {
      bucket[row.addr] = [];
    }
    bucket[row.addr].push(row);
  }
  return buckets.map(({date, value}) => Object.entries(value).map(([addr, values]) => ({date, addr, value: values.reduce((a, b) => b.value + a, 0) / values.length}))).reduce((a, b) => a.concat(b), []);
}

function normalize(arr) {
  let min = Infinity;
  let max = 0;
  for (const v of arr) {
    if (v < min) {
      min = v;
    }
    if (v > max) {
      max = v;
    }
  }
  return arr.map(v => (v - min) / (max - min));
}

async function getData() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(end.getHours() + 1, 0, 0, 0);
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(start.getHours(), 0, 0, 0);
  console.log(start, end);

  const result = await pool.query('select * from raw where (addr = "28790994970803ca" or addr = "282b2694970e03b7") and (date > $1 and date < $2) order by date asc', [start, end]);
  const data = result.rows;
  const buckets = [];
  let bucket = [];
  let i = 0;
  for (const date = new Date(start); date <= end; date.setMinutes(date.getMinutes() + 15)) {
    for (;i < data.length; i++) {
      const record = data[i];
      // const [record] = data.splice(0, 1);
      if (record.date > date) {
        bucket = [record.value];
        buckets.push(bucket);
        break;
      } else {
        bucket.push(record.value);
      }
    }
  }
  let y = buckets.map(bucket => bucket.reduce((a, b) => a + b, 0) / bucket.length);
  let ymin = Infinity;
  let ymax = 0;
  for (const yy of y) {
    if (yy < ymin) {
      ymin = yy;
    }
    if (yy > ymax) {
      ymax = yy;
    }
  }
  y = y.map(v => Math.floor((v - ymin) / (ymax - ymin) * 10000) / 10000)
  const x = Array.from(Array(y.length)).map((_, i) => i / y.length);
  return {x, y};
}

async function getData() {
  const data = result.rows;
  const buckets = [];
  let bucket = [];
  let i = 0;
  for (const date = new Date(start); date <= end; date.setMinutes(date.getMinutes() + 15)) {
    for (;i < data.length; i++) {
      const record = data[i];
      // const [record] = data.splice(0, 1);
      if (record.date > date) {
        bucket = [record.value];
        buckets.push(bucket);
        break;
      } else {
        bucket.push(record.value);
      }
    }
  }
  let y = buckets.map(bucket => bucket.reduce((a, b) => a + b, 0) / bucket.length);
  let ymin = Infinity;
  let ymax = 0;
  for (const yy of y) {
    if (yy < ymin) {
      ymin = yy;
    }
    if (yy > ymax) {
      ymax = yy;
    }
  }
  y = y.map(v => Math.floor((v - ymin) / (ymax - ymin) * 10000) / 10000)
  const x = Array.from(Array(y.length)).map((_, i) => i / y.length);
  return {x, y};
}




const server = http.createServer(app);

const wss = new WebSocket.Server({ server, path: '/ws' });

let client = null;

let connectionCount = 0;
wss.on('connection', async (ws, request) => {
  connectionCount++;
  if (client == null) {
    await start();
  } 
  /*
  const result = await pool.query('select distinct on (addr) date, addr, value, sample from raw order by addr, date desc');
  for (const record of result.rows) {
    ws.send(JSON.stringify(record));
  }
  */
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
