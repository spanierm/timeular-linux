const noble = require("noble");
const zeiServices = require("./zeiServices");

const RELEVANT_SERVICES = [zeiServices.ORIENTATION.uuid];
const TOP_SIDE_CHARACTERISTIC_UUID = zeiServices.ORIENTATION.characteristics.TOP_SIDE.uuid;
const RELEVANT_CHARACTERISTICS = [TOP_SIDE_CHARACTERISTIC_UUID];

const subscribeToCharacteristics = (orientationChangeCallback) => {
  _startScanning();
  _registerToZeiEvents(orientationChangeCallback);
};

const _startScanning = () => {
  noble.on("stateChange", state => {
    if (state === "poweredOn") {
      console.log("Starting to scan.");
      noble.startScanning(RELEVANT_SERVICES);
    }
  });
};

const _registerToZeiEvents = (orientationChangeEventCallback) => {
  noble.on("discover", peripheral => {
    if (_isZeiPeripheral(peripheral)) {
      console.log("Found a Timeular Zei peripheral!");
      _stopScanningAndConnect(peripheral, (characteristics) => {
        _subscribeToNotifyEvent(characteristics, TOP_SIDE_CHARACTERISTIC_UUID, orientationChangeEventCallback)
      });
    }
  });
};

const _isZeiPeripheral = (peripheral) => {
  return peripheral.advertisement.localName === "Timeular ZEI";
};

const _stopScanningAndConnect = (peripheral, connectionEstablishedCallback) => {
  console.log("Stopping to scan.");
  noble.stopScanning(() => {
    console.log("Connecting to the Timeular Zei peripheral.");
    peripheral.connect(error => {
      peripheral.discoverSomeServicesAndCharacteristics(RELEVANT_SERVICES, RELEVANT_CHARACTERISTICS, (error, services, characteristics) => {
        connectionEstablishedCallback(characteristics);
      });
    });
  });
};

const _subscribeToNotifyEvent = (characteristics, uuid, eventCallback) => {
  console.log(`Subscribing to the notify characteristic with the uuid '${uuid}.'`);
  const notifyCharacteristic = characteristics.find(
    characteristic => characteristic.uuid === uuid
  );
  notifyCharacteristic.on("data", eventCallback);
  notifyCharacteristic.subscribe();
};

module.exports = {
  subscribeToCharacteristics
};
