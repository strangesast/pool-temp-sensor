import asyncio
from bleak import discover, BleakClient

serviceUuid = '0000ffe0-0000-1000-8000-00805f9b34fb';
characteristicUuid = '0000ffe1-0000-1000-8000-00805f9b34fb';

async def run(loop):
    device = None

    print('looking for devices...')
    while device is None:
        devices = await discover()
        device = next((d for d in devices if d.name == 'tempSensor'), None)


    async with BleakClient(device.address, loop=loop) as client:
        queue = asyncio.Queue()
        print('connecting...');
        await client.connect()
        print('starting notificiations');
        await client.start_notify(characteristicUuid, lambda _, data: loop.call_soon(queue.put_nowait, data))

        print('waiting')
        while True:
            args = await queue.get()
            print(args)

        # await client.stop_notify(characteristicUuid)


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    
    try:
        loop.run_until_complete(run(loop))
    except KeyboardInterrupt:
        loop.close()
