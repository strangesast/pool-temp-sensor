var async = require('async');
var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var path = require('path');
var PROTO_PATH = path.join(__dirname, '../proto/temp-sensor.proto');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
var echo = protoDescriptor.grpc.gateway.testing;

function copyMetadata(call) {
  var metadata = call.metadata.getMap();
  var response_metadata = new grpc.Metadata();
  for (var key in metadata) {
    response_metadata.set(key, metadata[key]);
  }
  return response_metadata;
}

function doEcho(call, callback) {
  callback(null, {
    message: call.request.message
  }, copyMetadata(call));
}

function doEchoAbort(call, callback) {
  callback({
    code: grpc.status.ABORTED,
    message: 'Aborted from server side.'
  });
}

function doServerStreamingEcho(call) {
  var senders = [];
  function sender(message, interval) {
    return (callback) => {
      call.write({
        message: message
      });
      _.delay(callback, interval);
    };
  }
  for (var i = 0; i < call.request.message_count; i++) {
    senders[i] = sender(call.request.message, call.request.message_interval);
  }
  async.series(senders, () => {
    call.end(copyMetadata(call));
  });
}

/**
 * Get a new server with the handler functions in this file bound to the methods
 * it serves.
 * @return {!Server} The new server object
 */
function getServer() {
  return server;
}

if (require.main === module) {
  // If this is run as a script, start a server on an unused port
  var server = new grpc.Server();
  server.addService(echo.EchoService.service, {
    echo: doEcho,
    echoAbort: doEchoAbort,
    serverStreamingEcho: doServerStreamingEcho,
  });
  server.bind('0.0.0.0:9090', grpc.ServerCredentials.createInsecure());
  server.start();
}

exports.getServer = getServer;
