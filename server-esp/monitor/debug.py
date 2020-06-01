import os
import asyncio
import logging
from datetime import datetime

async def on_connect(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    #async for buf in reader:
    while True:
        try:
            buf = await reader.readexactly(12);
        except asyncio.exceptions.IncompleteReadError:
            return
        d = datetime.now()

        i = buf[1]
        addr = buf[2:10].hex()
        value = int.from_bytes(buf[10:12], byteorder='little', signed=True)

        print(i, addr, value, to_f(value))


def to_f(raw):
    return raw * 0.0140625 + 32


async def main():
    port = os.environ.get('PORT', '3000')
    server = await asyncio.start_server(on_connect, port=port)
    await server.serve_forever()


if __name__ == '__main__':
    asyncio.run(main())
