const noble = require('noble')

const log = require('./logFactory').getLogger()
const zeiServices = require('./zeiServices')

const RELEVANT_SERVICES = [zeiServices.ORIENTATION.uuid]
const TOP_SIDE_CHARACTERISTIC_UUID = zeiServices.ORIENTATION.characteristics.TOP_SIDE.uuid
const RELEVANT_CHARACTERISTICS = [TOP_SIDE_CHARACTERISTIC_UUID]

const subscribeToCharacteristics = orientationChangeCallback => {
  _registerToZeiEvents(orientationChangeCallback)
  _startScanning()
}

const _registerToZeiEvents = orientationChangeEventCallback => {
  noble.on('discover', peripheral => {
    if (_isZeiPeripheral(peripheral)) {
      log.debug(`Found a Timeular Zei peripheral with the Mac address ${peripheral.address}.`)
      _stopScanningAndConnect(peripheral, characteristics => {
        _subscribeToNotifyEvent(
          characteristics,
          TOP_SIDE_CHARACTERISTIC_UUID,
          orientationChangeEventCallback
        )
      })
    }
  })
}

const _isZeiPeripheral = peripheral => {
  return peripheral.advertisement.localName === 'Timeular ZEI'
}

const _stopScanningAndConnect = (peripheral, connectionEstablishedCallback) => {
  log.debug('Stopping to scan for a Timeular Zei.')
  noble.stopScanning(() => {
    log.debug(`Connecting to the Timeular Zei with the Mac address ${peripheral.address}.`)
    peripheral.connect(error => {
      if (error) {
        throw new Error(`Could not connect to the Timeular Zei with the Mac address ${peripheral.address}.`)
      }
      log.debug(`Connected to the Timeular Zei with the Mac address ${peripheral.address}.`)
      peripheral.discoverSomeServicesAndCharacteristics(
        RELEVANT_SERVICES,
        RELEVANT_CHARACTERISTICS,
        (error, services, characteristics) => {
          if (error) {
            throw new Error(`Could not discover the characteristics ${RELEVANT_CHARACTERISTICS.join(', ')}.`)
          }
          connectionEstablishedCallback(characteristics)
        }
      )
      _reconnectToZeiAfterDisconnect(peripheral)
    })
  })
}

const _reconnectToZeiAfterDisconnect = peripheral => {
  peripheral.once('disconnect', () => {
    log.debug(`Lost connection to Timeular Zei with the Mac address ${peripheral.address}. Trying to reconnect.`)
    noble.startScanning()
  })
}

const _subscribeToNotifyEvent = (characteristics, uuid, eventCallback) => {
  log.debug(
    `Subscribing to the notify characteristic with the uuid '${uuid}.'`
  )
  const notifyCharacteristic = characteristics.find(
    characteristic => characteristic.uuid === uuid
  )
  notifyCharacteristic.on('data', eventCallback)
  notifyCharacteristic.subscribe()
}

const _startScanning = () => {
  noble.on('stateChange', state => {
    if (state === 'poweredOn') {
      log.debug('Starting to scan for a Timeular Zei.')
      // todo Only scanning for dedicated services does not work.
      // noble.startScanning(RELEVANT_SERVICES)
      noble.startScanning()
    }
  })
}

module.exports = {
  subscribeToCharacteristics
}
