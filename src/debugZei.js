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

          readBatteryLevel(gattServices, characteristics);

          const topSideCharacteristic = characteristics.find(
            characteristic => characteristic.uuid === zeiServices.ORIENTATION.characteristics.TOP_SIDE.uuid
          );
          debugCharacteristic("top position", topSideCharacteristic);


          // const daCharacteristic = characteristics.find(
          //   characteristic => characteristic.uuid === zeiServices.d.characteristics.a.uuid
          // );
          // const dbCharacteristic = characteristics.find(
          //   characteristic => characteristic.uuid === zeiServices.d.characteristics.b.uuid
          // );
          // ledBlinkRotatingColors(zeiServices, characteristics);
          // await sleep(1000 * 5);

          // LED on for 3 seconds
          // - if written every second, the LED is on all time
          // - if written less often, e.g. every 2nd second, the LED is off after 3 seconds
          // value >0 activates the LED
          // repeatedlyWriteValueToCharacteristic("d-a", daCharacteristic, [1], 1000);

          // LED blinking
          // repeatedlyWriteValueToCharacteristic("d-b", dbCharacteristic, [2], 1000);


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
};

const repeatedlyWriteValueToCharacteristic = async (name, characteristic, values, intervallInMilliseconds) => {
  while (true) {
    characteristic.write(createWriteBuffer(values));

    await sleep(intervallInMilliseconds)
  }
};

const repeatedlyReadValueOfCharacteristic = async (name, characteristic, intervallInMilliseconds) => {
  while (true) {
    characteristic.read((error, data) => {
      for (let i = 0; i < data.length; i++) {
        console.log(`${name} - readUInt(${i}): ${data.readUInt8(i)}`)
      }
    });

    await sleep(intervallInMilliseconds)
  }
};

const ledBlinkRotatingColors = async (zeiServices, characteristics) => {
  const ledCharacteristic = characteristics.find(
    characteristic => characteristic.uuid === zeiServices.BUTTON_PANEL.characteristics.LED_COLOR.uuid
  );

  let color = 1;
  while (true) {
    console.log(`color: ${color}`);
    ledCharacteristic.write(createWriteBuffer([color]));

    color = ++color % 3;
    await sleep(1000);
  }
};

const readBatteryLevel = (gattServices, characteristics) => {
  const batteryLevelCharacteristic = characteristics.find(
    characteristic => characteristic.uuid === gattServices.BATTERY_SERVICE.characteristics.BATTERY_LEVEL.uuid
  );
  batteryLevelCharacteristic.read((error, data) => {
    console.log(`current battery level is ${data.readUInt8(0)}%`);
  });
};

const createWriteBuffer = (values) => {
  const buffer = new Buffer(values.length);
  values.forEach(value => buffer.writeUInt8(value));
  return buffer
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
