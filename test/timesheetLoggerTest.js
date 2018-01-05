const fs = require('fs')
const moment = require('moment')
const proxyquire = require('proxyquire')
require('should')
const sinon = require('sinon')
const timesheetLogger = require('../src/timesheetLogger.js')
const tmp = require('tmp')

describe('calculate (rounded) time from moment', () => {
  describe('entries match HH:mm', () => {
    it('entries must match HH:mm', () => {
      const currentTime = timesheetLogger.getTimesheetTime()

      currentTime.should.match(/\d{2}:\d{2}/)
    })
  })

  const checkCalculation = (currentHour, currentMinute, expectedTimesheetTime) => {
    it(`${currentHour}:${currentMinute} => ${expectedTimesheetTime}`, () => {
      const testMoment = moment().hour(currentHour).minute(currentMinute)

      const currentTime = timesheetLogger.getTimesheetTime(testMoment)

      currentTime.should.be.equal(expectedTimesheetTime)
    })
  }

  describe('minutes are divisible by three', () => {
    checkCalculation(12, 0, '12:00')
    checkCalculation(9, 11, '09:12')
    checkCalculation(22, 52, '22:54')
  })

  describe('hour is increased if rounded', () => {
    checkCalculation(8, 59, '09:00')
    checkCalculation(23, 58, '00:00')
  })
})

describe('integration tests with temporary files', () => {
  const doIntegrationTestWithTemporaryTimesheetFile = (testDescription, changesOfTimeularZei, expectedContent) => {
    it(testDescription, () => {
      const timesheetWithStubbedMomentLibrary = setupMomentStub(changesOfTimeularZei)
      const {logChangesToTimesheetCallback, filename} =
        logChangesToTemporaryTimesheetCallback(timesheetWithStubbedMomentLibrary)

      for (let i = 0; i < changesOfTimeularZei.length; i++) {
        logChangesToTimesheetCallback(createTopSideDataBuffer(changesOfTimeularZei[i].topSide))
      }

      const actualConent = fs.readFileSync(filename).toString()
      actualConent.should.equal(expectedContent)
    })
  }

  const setupMomentStub = (changesOfTimeularZei) => {
    const momentStub = sinon.stub()
    for (let i = 0; i < changesOfTimeularZei.length; i++) {
      momentStub.onCall(i).returns(changesOfTimeularZei[i].moment)
    }
    return proxyquire('../src/timesheetLogger.js', {
      'moment': momentStub
    })
  }

  const logChangesToTemporaryTimesheetCallback = (timesheetWithStubbedMomentLibrary) => {
    const temporaryFile = tmp.fileSync()
    const logChangesToTimesheetCallback =
      timesheetWithStubbedMomentLibrary.logChangesToTimesheetCallback(temporaryFile.name)
    return {
      logChangesToTimesheetCallback,
      filename: temporaryFile.name
    }
  }

  const createTopSideDataBuffer = (topSideValue) => {
    const buffer = new Buffer(1)
    buffer.writeInt8(topSideValue)
    return buffer
  }

  describe('add empty line if Timeular Zei is in base', () => {
    [timesheetLogger.TOP_SIDE.TOP, timesheetLogger.TOP_SIDE.BOTTOM].forEach((topSide) => {
      doIntegrationTestWithTemporaryTimesheetFile(`top side is ${timesheetLogger.TOP_SIDE.of(topSide)}`, [
        {moment: moment().hour(11).minute(0), topSide: timesheetLogger.TOP_SIDE.A},
        {moment: moment().hour(12).minute(0), topSide: topSide},
        {moment: moment().hour(13).minute(0), topSide: timesheetLogger.TOP_SIDE.A},
        {moment: moment().hour(14).minute(0), topSide: timesheetLogger.TOP_SIDE.B},
      ], '11:00 - 12:00 top side was A\n' +
        '\n' +
        '13:00 - 14:00 top side was A\n'
      )
    })

  })

  describe('skip entries if time did not change', () => {
    doIntegrationTestWithTemporaryTimesheetFile('same minute', [
      {moment: moment().hour(8).minute(30), topSide: timesheetLogger.TOP_SIDE.MAIL},
      {moment: moment().hour(8).minute(30), topSide: timesheetLogger.TOP_SIDE.CHAT},
      {moment: moment().hour(9).minute(30), topSide: timesheetLogger.TOP_SIDE.MAIL}
    ], '08:30 - 09:30 top side was CHAT\n')

    doIntegrationTestWithTemporaryTimesheetFile('same minute after rounding', [
      {moment: moment().hour(8).minute(28), topSide: timesheetLogger.TOP_SIDE.MAIL},
      {moment: moment().hour(8).minute(30), topSide: timesheetLogger.TOP_SIDE.CHAT},
      {moment: moment().hour(9).minute(29), topSide: timesheetLogger.TOP_SIDE.MAIL},
      {moment: moment().hour(9).minute(30), topSide: timesheetLogger.TOP_SIDE.CLOCK},
      {moment: moment().hour(10).minute(30), topSide: timesheetLogger.TOP_SIDE.MAIL}
    ], '08:30 - 09:30 top side was CHAT\n' +
      '09:30 - 10:30 top side was CLOCK\n')

    doIntegrationTestWithTemporaryTimesheetFile('for breaks as well', [
      {moment: moment().hour(8).minute(28), topSide: timesheetLogger.TOP_SIDE.TOP},
      {moment: moment().hour(8).minute(30), topSide: timesheetLogger.TOP_SIDE.BOTTOM},
      {moment: moment().hour(9).minute(0), topSide: timesheetLogger.TOP_SIDE.MAIL},
      {moment: moment().hour(9).minute(29), topSide: timesheetLogger.TOP_SIDE.TOP},
      {moment: moment().hour(9).minute(30), topSide: timesheetLogger.TOP_SIDE.CLOCK},
      {moment: moment().hour(10).minute(30), topSide: timesheetLogger.TOP_SIDE.MAIL}
    ], '\n' +
      '09:00 - 09:30 top side was MAIL\n' +
      '09:30 - 10:30 top side was CLOCK\n')
  })

  doIntegrationTestWithTemporaryTimesheetFile('end-to-end test', [
    {moment: moment().hour(8).minute(0), topSide: timesheetLogger.TOP_SIDE.MAIL},
    {moment: moment().hour(8).minute(15), topSide: timesheetLogger.TOP_SIDE.A},
    {moment: moment().hour(9).minute(0), topSide: timesheetLogger.TOP_SIDE.CLOCK},
    {moment: moment().hour(9).minute(15), topSide: timesheetLogger.TOP_SIDE.A},
    {moment: moment().hour(9).minute(45), topSide: timesheetLogger.TOP_SIDE.TOP},
    {moment: moment().hour(10).minute(0), topSide: timesheetLogger.TOP_SIDE.A},
    {moment: moment().hour(12).minute(0), topSide: timesheetLogger.TOP_SIDE.B},
    {moment: moment().hour(13).minute(0), topSide: timesheetLogger.TOP_SIDE.BOTTOM},
    {moment: moment().hour(14).minute(0), topSide: timesheetLogger.TOP_SIDE.B},
    {moment: moment().hour(14).minute(0), topSide: timesheetLogger.TOP_SIDE.C},
    {moment: moment().hour(16).minute(0), topSide: timesheetLogger.TOP_SIDE.A}
  ], '08:00 - 08:15 top side was MAIL\n' +
    '08:15 - 09:00 top side was A\n' +
    '09:00 - 09:15 top side was CLOCK\n' +
    '09:15 - 09:45 top side was A\n' +
    '\n' +
    '10:00 - 12:00 top side was A\n' +
    '12:00 - 13:00 top side was B\n' +
    '\n' +
    '14:00 - 16:00 top side was C\n'
  )
})
