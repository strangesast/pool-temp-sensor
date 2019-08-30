const noble = require('noble');

const serviceUuid = '0000ffe0-0000-1000-8000-00805f9b34fb';
const characteristicUuid = '0000ffe1-0000-1000-8000-00805f9b34fb';
const serviceUuids = [serviceUuid];


noble.on('stateChange', state => {
  if (state === 'poweredOn') {
    noble.startScanning(serviceUuids, true);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', peripheral => {
  console.log('Found device with local name: ' + peripheral.advertisement.localName);
  console.log('advertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);
  console.log();
  peripheral.connect(error => {
    console.log('connected to peripheral: ' + peripheral.uuid);
    peripheral.discoverServices(serviceUuids, (error, services) => {
      console.log('got service');
      const service = services[0];
      service.discoverCharacteristics([characteristicUuid], (error, characteristics) => {
        console.log('got characteristic');
        batteryLevelCharacteristic.on('data', function(data, isNotification) {
          console.log('got data');
        });
        batteryLevelCharacteristic.subscribe(function(error) {
          console.log('subscribed to characteristic');
        });

      });
    });
  });
});
