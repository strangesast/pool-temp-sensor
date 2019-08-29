from bluepy import btle
from datetime import datetime
from queue import Queue
from collections import namedtuple
import grpc
from google.protobuf.timestamp_pb2 import Timestamp

import pooltempsensor_pb2
import pooltempsensor_pb2_grpc


def now():
    """return protobuf timestamp"""
    current_time = datetime.utcnow().timestamp()
    seconds = int(current_time)
    nanos = int((current_time - seconds) * 10**9)
    timestamp = Timestamp(seconds=seconds, nanos=nanos)
    return timestamp


def convert(v):
    """from DallasTemperature: C = RAW/128, F = (C*1.8)+32"""
    return v * 0.0140625 + 32;

def parse(data):
    """data is 20 bytes split into two readings.  first 6 bytes of each 10 byte group represent OneWire address of temp sensor. bytes 7, 8 are the measured value (16 bit).  remaining bytes are unused"""
    for i in range(0, 20, 10):
        yield int.from_bytes(data[i:i+6], 'big'), int.from_bytes(data[i+6:i+8], 'big')


class Delegate(btle.DefaultDelegate):
    def __init__(self, cb):
        btle.DefaultDelegate.__init__(self)
        self.cb = cb;

    def handleNotification(self, cHandle, data):
        self.cb(data)

# Example mongodb connection
#from pymongo import MongoClient
#from pymongo.errors import ConnectionFailure
#
#print('connecting to mongodb...')
#client = MongoClient(MONGO_HOST, 27017)
#try:
#    # simple network request to verify connection
#    client.admin.command('ismaster')
#except ConnectionFailure as e:
#    print("Server not available")
#    raise e
#print('connected.');
#db = client['pool-temp-sensor']
#col = db['samples']

# Example aggregation
#db.getCollection('samples').aggregate([
#  {$unwind: {path: '$values'}},
#  {$group: {_id: '$values.id', values: {$addToSet: '$values.raw'}}},
#  {$unwind: {path: '$values'}},
#  {$sort: {values: 1}},
#  {$project: {values: {$divide: ['$values', 8]}}},
#])


COMPLETE_LOCAL_NAME = 9

def retrieve_notifications():
    address = None
    scanner = btle.Scanner()
    while address is None:
        scan_time = 10
        print('scanning for {} seconds...'.format(scan_time))
        for device in scanner.scan(scan_time): # scan for 10 seconds
            device_name = device.getValueText(COMPLETE_LOCAL_NAME) # get adtype for "Complete Local Name"
            if device_name is not None and 'tempSensor' in device_name:
                address = device.addr

    print('found one!')

    queue = Queue()
    #address = 'D0:B5:C2:9F:95:02'
    peripheral = btle.Peripheral(address).withDelegate(Delegate(lambda val: queue.put(val)))
    
    while True:
        while not queue.empty():
            yield queue.get()
        if peripheral.waitForNotifications(1): # one second timeout
            # handleNotification() was called
            continue
    
        print('Waiting...')
        # Perhaps do something else here

def parse_notifications(notifications):
    for data in iterator:
        yield pooltempsensor_pb2.Temps(
            values={format(_id, 'x'): raw for _id, raw in parse(data) if _id != 0},
            date=now(),
        )

if __name__ == '__main__':
    HOST = os.environ.get('GRPC_HOST') or 'localhost'
    PORT = os.environ.get('GRPC_PORT') or '50051'

    iterator = retrieve_notifications()
    iterator = parse_notifications(iterator)

    with grpc.insecure_channel('{}:{}'.format(HOST, PORT)) as channel:
        stub = pooltempsensor_pb2_grpc.TempSensorStub(channel)
        response = stub.RecordTemps(TEST_ITERATOR)
        
        if response is None:
            print('no response')
        else:
            print('Recorded {} values from {} new sensors'.format(
                response.count, response.sensorCount))
