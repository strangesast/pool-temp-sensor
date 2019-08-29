from bluepy import btle
from datetime import datetime
import os
from collections import namedtuple
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

MONGO_HOST = os.environ.get('MONGO_HOST') or 'localhost'

Value = namedtuple('Value', ['id', 'raw', 'tempf'])

def convert(v):
    return v * 0.0140625 + 32;

def parse(data):
    for i in range(0, 20, 10):
        ID = int.from_bytes(data[i:i+6], 'big')
        if ID == 0:
            continue
        RAW = int.from_bytes(data[i+6:i+8], 'big')
        TEMPF = convert(RAW)
        yield Value(format(ID, 'x'), RAW, TEMPF)


class Delegate(btle.DefaultDelegate):
    def __init__(self, cb):
        btle.DefaultDelegate.__init__(self)
        self.cb = cb;

    def handleNotification(self, cHandle, data):
        self.cb(list(parse(data)))

# Example aggregation
#db.getCollection('samples').aggregate([
#  {$unwind: {path: '$values'}},
#  {$group: {_id: '$values.id', values: {$addToSet: '$values.raw'}}},
#  {$unwind: {path: '$values'}},
#  {$sort: {values: 1}},
#  {$project: {values: {$divide: ['$values', 8]}}},
#])

if __name__ == '__main__':
    print('connecting to mongodb...')
    client = MongoClient(MONGO_HOST, 27017)
    try:
        # simple network request to verify connection
        client.admin.command('ismaster')
    except ConnectionFailure as e:
        print("Server not available")
        raise e
    print('connected.');
    db = client['pool-temp-sensor']
    col = db['samples']


    address = None
    scanner = btle.Scanner()
    while address is None:
        print('scanning...')
        for device in scanner.scan(10): # scan for 10 seconds
            device_name = device.getValueText(9)
            if device_name is not None and 'tempSensor' in device_name:
                address = device.addr

    print('found one!')

    def write_record(arr):
        if len(arr) == 0:
            return

        result = col.insert_one({
              "recorded_at": datetime.utcnow(),
              "values": [v._asdict() for v in arr],
            })

    #address = 'D0:B5:C2:9F:95:02'
    p = btle.Peripheral(address).withDelegate(Delegate(write_record))
    
    while True:
        if p.waitForNotifications(1): # one second timeout
            # handleNotification() was called
            continue
    
        print('Waiting...')
        # Perhaps do something else here
