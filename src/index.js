const noble = require("noble");
const Zei = require("./zei");

noble.on("stateChange", state => {
  if (state === "poweredOn") {
    console.log("Starting to scan...");
    noble.startScanning();
  } else {
    console.log("Stopping to scan...");
    noble.stopScanning();
  }
});

noble.on("discover", peripheral => {
  if (Zei.isZEIPeripheral(peripheral)) {
    noble.stopScanning(() => {
      peripheral.connect(error => {
        peripheral.discoverAllServicesAndCharacteristics((error, services, characteristics) => {
          // to do
        });
      });
    });
  }
});
