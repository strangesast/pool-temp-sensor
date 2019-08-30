import os
import random
import time
import grpc
from google.protobuf.timestamp_pb2 import Timestamp

import pooltempsensor_pb2
import pooltempsensor_pb2_grpc


def now():
    """return protobuf timestamp"""
    current_time = time.time()
    seconds = int(current_time)
    nanos = int((current_time - seconds) * 10**9)
    timestamp = Timestamp(seconds=seconds, nanos=nanos)
    return timestamp


def test():
    """return ten sample data points"""
    for _ in range(10):
        date = now()
        temps = pooltempsensor_pb2.Temps(
            values={
                '000000': random.random(),
                '000001': random.random(),
            },
            date=date
        )
        yield temps



if __name__ == '__main__':
    HOST = os.environ.get('GRPC_HOST') or 'localhost'
    PORT = os.environ.get('GRPC_PORT') or '50051'

    TEST_ITERATOR = test()

    with grpc.insecure_channel('{}:{}'.format(HOST, PORT)) as channel:
        stub = pooltempsensor_pb2_grpc.TempSensorStub(channel)
        response = stub.RecordTemps(TEST_ITERATOR)

        if response is None:
            print('no response')
        else:
            print('Recorded {} values from {} new sensors'.format(
                response.count, response.sensorCount))
