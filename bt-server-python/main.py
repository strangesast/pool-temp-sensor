import grpc
import os
from google.protobuf.timestamp_pb2 import Timestamp
import random
import time

import pooltempsensor_pb2
import pooltempsensor_pb2_grpc


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
    host = os.environ.get('GRPC_HOST') or 'localhost'
    port = os.environ.get('GRPC_PORT') or '50051'
    
    
    iterator = test()
    time.sleep(2)

    with grpc.insecure_channel('{}:{}'.format(host, port)) as channel:
    
    
        stub = pooltempsensor_pb2_grpc.TempSensorStub(channel)
        response = stub.RecordTemps(iterator)
        if response is None:
            print('no response')
        else:
            print('Recorded {} values from {} new sensors'.format(response.count, response.sensorCount))
