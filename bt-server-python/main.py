import grpc
from google.protobuf.timestamp_pb2 import Timestamp

import pooltempsensor_pb2
import pooltempsensor_pb2_grpc


with grpc.insecure_channel('{}:{}'.format(host, port)) as channel:
    stub = pooltempsensor_pb2_grpc.TempSensorStub(channel)
    response = stub.RecordTemps(iterator)
