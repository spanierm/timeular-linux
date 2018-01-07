const consoleLogger = require('../src/consoleLogger')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const _createConsoleLoggerWithLogSpy = () => {
  const consoleLoggerSpy = {
    info: sinon.spy()
  }
  const consoleLogger = proxyquire('../src/consoleLogger.js', {
    './logFactory': {
      getLogger: () => {
        return consoleLoggerSpy
      }
    }
  })
  return {
    consoleLoggerSpy,
    consoleLogger
  }
}

const doIntegrationTestWithLoggerSpy = (topSides) => {
  it(topSides.map(topSide => consoleLogger.TOP_SIDE.of(topSide)).join(' => '), () => {
    const {consoleLoggerSpy, consoleLogger} = _createConsoleLoggerWithLogSpy()

    topSides.forEach(topSide => {
      consoleLogger.logOrientationChangesToConsole(_createTopSideDataBuffer(topSide), false)
    })

    consoleLoggerSpy.info.args.length.should.equal(topSides.length)
    let previouseTopSide
    topSides.forEach((topSide, index) => {
      consoleLoggerSpy.info.args[index].length.should.equal(1)
      let checkForTopSidesRegex
      if (previouseTopSide) {
        checkForTopSidesRegex = new RegExp(`${consoleLogger.TOP_SIDE.of(previouseTopSide)}.+${consoleLogger.TOP_SIDE.of(topSide)}`)
      }
      else {
        checkForTopSidesRegex = new RegExp(`${consoleLogger.TOP_SIDE.of(topSide)}`)
      }
      consoleLoggerSpy.info.args[index][0].should.match(checkForTopSidesRegex)
      previouseTopSide = topSide
    })
  })
}

const _createTopSideDataBuffer = (topSideValue) => {
  const buffer = new Buffer(1)
  buffer.writeInt8(topSideValue)
  return buffer
}

describe('log all top side changes', () => {
  describe('check subsequent changes', () => {
    doIntegrationTestWithLoggerSpy([
      consoleLogger.TOP_SIDE.TOP_NORTH
    ])
    doIntegrationTestWithLoggerSpy([
      consoleLogger.TOP_SIDE.TOP_NORTH,
      consoleLogger.TOP_SIDE.TOP_EAST
    ])
    doIntegrationTestWithLoggerSpy([
      consoleLogger.TOP_SIDE.TOP_NORTH,
      consoleLogger.TOP_SIDE.TOP_NORTH
    ])
    doIntegrationTestWithLoggerSpy([
      consoleLogger.TOP_SIDE.TOP_NORTH,
      consoleLogger.TOP_SIDE.TOP_SOUTH,
      consoleLogger.TOP_SIDE.TOP_NORTH,
      consoleLogger.TOP_SIDE.BOTTOM_EAST,
      consoleLogger.TOP_SIDE.TOP_WEST
    ])
    doIntegrationTestWithLoggerSpy([
      consoleLogger.TOP_SIDE.TOP_TIP,
      consoleLogger.TOP_SIDE.TOP_EAST,
      consoleLogger.TOP_SIDE.TOP_SOUTH,
      consoleLogger.TOP_SIDE.TOP_WEST,
      consoleLogger.TOP_SIDE.TOP_NORTH,
      consoleLogger.TOP_SIDE.BOTTOM_TIP,
      consoleLogger.TOP_SIDE.BOTTOM_EAST,
      consoleLogger.TOP_SIDE.BOTTOM_SOUTH,
      consoleLogger.TOP_SIDE.BOTTOM_WEST,
      consoleLogger.TOP_SIDE.BOTTOM_NORTH
    ])
  })
})
