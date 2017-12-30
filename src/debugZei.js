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
        peripheral.discoverAllServicesAndCharacteristics(async (error, services, characteristics) => {
          // debugZei.logAllServicesWithCharacteristics(services);
          // const zeiServices = debugZei.getAllServicesWithCharacterstics(services);
          // console.log(zeiServices);

          const gattServices = require("./gattServices");
          const zeiServices = require("./zeiServices");

          // ledBlinkRotatingColors(characteristics);

          const characteristicToDebug = characteristics.find(
            characteristic => characteristic.uuid === zeiServices.d.characteristics.a.uuid
          );
          debugCharacteristic("d-a", characteristicToDebug);

        });
      });
    });
  }
});

const debugCharacteristic = async (name, characteristicToDebug) => {
  characteristicToDebug.on("data", (data, isNotification) => {
    console.log();
    console.log(`${name} - data: ${data}`);
    for (let i = 0; i < data.length; i++) {
      console.log(`${name} - data.readUInt8(${i}): ${data.readUInt8(i)}`);
    }
    console.log(`${name} - isNotification: ${isNotification}`);
    console.log();
  });

  characteristicToDebug.subscribe();

  // characteristicToDebug.once("write", () => {
  //   console.log(`${name} - written`)
  // });

  // characteristicToDebug.once("notify", state => {
  //   console.log(`${name} - : state: ${state}`)
  // });
};

const ledBlinkRotatingColors = async (characteristics) => {
  const ledCharacteristic = characteristics.find(
    characteristic => characteristic.uuid === zeiServices.BUTTON_PANEL.characteristics.LED_COLOR.uuid
  );

  let color = 0;
  while (true) {
    await sleep(1000);
    console.log(`color: ${color}`);
    const buffer = new Buffer(1);
    buffer.writeUInt8(color);
    ledCharacteristic.write(buffer);

    color = ++color % 3;
  }
};

const logAllServicesWithCharacteristics = services => {
  services.forEach(service => {
    const zeiServiceUuidMatch = isZeiUuid(service.uuid);
    if (zeiServiceUuidMatch) {
      console.log(`found a Zei service with the uuid: ${service.uuid}`);
      console.log(`  short uuid                           ${zeiServiceUuidMatch[1]}`);
      service.characteristics.forEach((characteristic, index) => {
        console.log(`  characterstic ${index}                      ${isZeiUuid(characteristic.uuid)[1]}`);
      });
    }
    else {
      console.log(`found a Gatt service with the uuid: ${service.uuid}`);
      service.characteristics.forEach((characteristic, index) => {
        console.log(`  characterstic ${index}                       ${characteristic.uuid}`);
      });
    }
    console.log();
  });
};

const getAllServicesWithCharacterstics = (services) => {
  const zei = {};
  const gatt = {};
  services.forEach(service => {
    const serviceType = isZeiUuid(service.uuid) ? zei : gatt;
    serviceType[service.uuid] = [];
    service.characteristics.forEach(characteristic => {
      serviceType[service.uuid].push(characteristic.uuid)
    });
  });
  return {
    zei,
    gatt
  }
};

const isZeiUuid = uuid => {
  const uuidRegex = /c7e7(\S{4})c84711e681758c89a55d403c/i;
  return uuidRegex.exec(uuid);
};

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
