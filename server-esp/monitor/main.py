import os
import asyncio
import asyncpg
import logging
from datetime import datetime
from asyncpg.exceptions import CannotConnectNowError


async def worker(pool: asyncpg.pool.Pool, queue: asyncio.Queue):
    ''' retrieve a few records from queue, attempt to store them in postgres db
    '''
    records = []
    while True:
        record = await queue.get()
        records.append(record)
        while True:
            try:
                records.append(queue.get_nowait())
            except asyncio.QueueEmpty:
                break
        async with pool.acquire() as connection:
            async with connection.transaction():
                sample = None
                for addr, value, d in records:
                    expr = sample or 'nextval(\'sample_sequence\')'
                    q = f'INSERT INTO raw (sample, addr, value, date) VALUES ({expr}, $1, $2, $3) RETURNING sample'
                    result = await connection.fetch(q, addr, value, d)
                    queue.task_done()
                    sample = result[0].get('sample')
            records.clear()


async def on_connect(reader: asyncio.StreamReader, writer: asyncio.StreamWriter, queue: asyncio.Queue):
    sample = None
    async for buf in read_reader(reader):
        d = datetime.utcnow()
        try:
            i = buf[1]
            addr = buf[2:10].hex()
            value = int.from_bytes(buf[10:12], byteorder='little', signed=True)
        except:
            pass
        queue.put_nowait((addr, value, d))


async def read_reader(reader: asyncio.StreamReader):
    while True:
        try:
            buf = await reader.readexactly(12);
            yield buf
        except asyncio.exceptions.IncompleteReadError:
            return


def to_f(raw):
    return raw * 0.0140625 + 32


def handle_exception(loop, context):
    msg = context.get('exception', context['message'])
    logging.error(f'Caught exception: {msg}')
    logging.info('Shutting down...')
    asyncio.create_task(shutdown(loop))


def shutdown(loop, signal=None):
    """Cleanup tasks tied to the service's shutdown."""
    if signal:
        logging.info(f'Received exit signal {signal.name}...')
    logging.info('Closing database connections')

    #await conn.close()
    loop.stop()

    pending = asyncio.all_tasks()
    loop.run_until_complete(asyncio.gather(*pending))

    logging.info('Shutdown complete.')


async def main():
    config = {
        'database': os.environ.get('PG_DB_NAME',  'temps'),
        'user':     os.environ.get('PG_USER',     'postgres'),
        'password': os.environ.get('PG_PASSWORD', 'password'),
        'host':     os.environ.get('PG_HOST',     'localhost'),
        'port':     os.environ.get('PG_PORT',     '5432'),
    }
    logging.info(f'Using db config {config}...')

    error = None
    for _ in range(4):
        if error:
            logging.info('retrying in 4s...')
            await asyncio.sleep(4)
        try:
            pool = await asyncpg.create_pool(**config)
            break
        except Exception as e:
            error = e
    else:
        raise error

    queue = asyncio.Queue(0)

    #asyncio.get_event_loop().set_exception_handler(handle_exception)

    port = os.environ.get('PORT', '3000')
    server = await asyncio.start_server(lambda r, w: on_connect(r, w, queue), port=port)
    await asyncio.gather(server.serve_forever(), worker(pool, queue))


if __name__ == '__main__':
    asyncio.run(main())
