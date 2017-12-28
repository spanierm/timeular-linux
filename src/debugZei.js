const isZeiUuid = uuid => {
  const uuidRegex = /c7e7(\S{4})c84711e681758c89a55d403c/i;
  return uuidRegex.exec(uuid);
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
    console.log()
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

module.exports = {
  isZeiUuid,
  getAllServicesWithCharacterstics,
  logAllServicesWithCharacteristics
};
