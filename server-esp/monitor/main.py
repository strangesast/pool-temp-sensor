import os
import asyncio
import asyncpg
import logging
from contextvars import ContextVar
from datetime import datetime
from asyncpg.exceptions import CannotConnectNowError

db = ContextVar('db')

async def on_connect(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    conn = db.get()
    sample = None
    async for buf in reader:
        d = datetime.now()
        try:
            i, addr, v = [int(s.strip()) for s in buf.decode().strip().split(',')]
        except:
            continue

        expr = sample or 'nextval(\'sample_sequence\')'
        q = f'INSERT INTO raw (sample, id, addr, value, date) VALUES ({expr}, $1, $2, $3, $4) RETURNING sample'
        result = await conn.fetch(q, i, addr, v, d)
        sample = result[0].get('sample')


def to_f(raw):
    return raw * 0.0140625 + 32


def handle_exception(loop, context):
    msg = context.get('exception', context['message'])
    logging.error(f'Caught exception: {msg}')
    logging.info('Shutting down...')
    asyncio.create_task(shutdown(loop))


async def shutdown(loop, signal=None):
    """Cleanup tasks tied to the service's shutdown."""
    if signal:
        logging.info(f'Received exit signal {signal.name}...')
    logging.info('Closing database connections')

    conn = db.get()
    await conn.close()


async def main():
    config = {
        'database': os.environ.get('PG_DB_NAME',  'temps'),
        'user':     os.environ.get('PG_USER',     'postgres'),
        'password': os.environ.get('PG_PASSWORD', 'password'),
        'host':     os.environ.get('PG_HOST',     'localhost'),
        'port':     os.environ.get('PG_PORT',     '5432'),
    }

    conn = None
    error = None
    logging.info(f'Using db config {config}...')
    for _ in range(4):
        try:
            conn = await asyncpg.connect(**config)
            break
        except CannotConnectNowError as e:
            logging.info('retrying in 4s...')
            error = e
            await asyncio.sleep(4)
    else:
        raise error

    db.set(conn);

    asyncio.get_event_loop().set_exception_handler(handle_exception)

    port = os.environ.get('PORT', '3000')
    server = await asyncio.start_server(on_connect, port=port)
    await server.serve_forever()


if __name__ == '__main__':
    asyncio.run(main())
