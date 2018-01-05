const log = require('./logger')

// - fields following the point of the compass with the push button panel heading north
// - distinction top / bottom (looking from the side with the push button panel horizontally):
//   - top: Zei logo readable, i.e. push button on the left while looking at it
//   - bottom: Zei logo upside down, i.e. push button on the right while looking at it
const TOP_SIDE = {
  TOP_TIP: 0,
  BOTTOM_NORTH: 1,
  BOTTOM_WEST: 2,
  BOTTOM_SOUTH: 3,
  BOTTOM_EAST: 4,
  TOP_NORTH: 5,
  TOP_WEST: 6,
  TOP_SOUTH: 7,
  TOP_EAST: 8,
  BOTTOM_TIP: 9,

  of: value => {
    switch (value) {
      case 0:
        return 'TOP_TIP'
      case 1:
        return 'BOTTOM_NORTH'
      case 2:
        return 'BOTTOM_WEST'
      case 3:
        return 'BOTTOM_SOUTH'
      case 4:
        return 'BOTTOM_EAST'
      case 5:
        return 'TOP_NORTH'
      case 6:
        return 'TOP_WEST'
      case 7:
        return 'TOP_SOUTH'
      case 8:
        return 'TOP_EAST'
      case 9:
        return 'BOTTOM_TIP'
    }
  }
}

let currentTopSide

// eslint-disable-next-line no-unused-vars
const logOrientationChangesToConsole = (data, isNotification) => {
  const newTopSide = data.readUInt8(0)
  if (currentTopSide) {
    log.info(`changed top side: ${TOP_SIDE.of(currentTopSide)} => ${TOP_SIDE.of(newTopSide)} (values: ${currentTopSide} => ${newTopSide})`)
  }
  else {
    log.info(`initial change of top side: ${TOP_SIDE.of(newTopSide)} (value: => ${newTopSide})`)
  }
  currentTopSide = newTopSide
}

module.exports = {
  logOrientationChangesToConsole,
  TOP_SIDE
}
