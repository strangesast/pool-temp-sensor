#import asyncio
import time
import random
from pprint import pprint
from bleak import discover, BleakClient
import pooltempsensor_pb2_grpc
import pooltempsensor_pb2
import grpc
from google.protobuf.timestamp_pb2 import Timestamp
import time

serviceUuid = '0000ffe0-0000-1000-8000-00805f9b34fb';
characteristicUuid = '0000ffe1-0000-1000-8000-00805f9b34fb';

#async def request_temperatures(loop):
#    device = None
#
#    print('looking for devices...')
#    while device is None:
#        devices = await discover()
#        device = next((d for d in devices if d.name == 'tempSensor'), None)
#
#
#    async with BleakClient(device.address, loop=loop) as client:
#        queue = asyncio.Queue()
#        print('connecting...');
#        await client.connect()
#        print('starting notificiations');
#        await client.start_notify(characteristicUuid, lambda _, data: loop.call_soon(queue.put_nowait, data))
#
#        print('waiting')
#        while True:
#            args = await queue.get()
#            print(args)
#            yield args
#
#        # await client.stop_notify(characteristicUuid)


def now():
    now = time.time()
    seconds = int(now)
    nanos = int((now - seconds) * 10**9)
    timestamp = Timestamp(seconds=seconds, nanos=nanos)
    return timestamp


def test():
    for each in range(10):
        date = now()
        temps = pooltempsensor_pb2.Temps(values={
            '000000': random.random(),
            '000001': random.random(),
            }, date=date)
        yield temps


if __name__ == '__main__':
    #loop = asyncio.get_event_loop()

    iterator = test()
    
    print('Recording values...')
    with grpc.insecure_channel('localhost:50051') as channel:
        stub = pooltempsensor_pb2_grpc.TempSensorStub(channel)
        response = stub.RecordTemps(iterator)
        if response is None:
            print('no response')
        else:
            print('Recorded {} values from {} new sensors'.format(response.count, response.sensorCount))
    
    #try:
    #    loop.run_until_complete(run(loop))
    #except KeyboardInterrupt:
    #    loop.close()
