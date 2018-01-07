const chai = require('chai')
const fs = require('fs')
const moment = require('moment')
const path = require('path')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const tmp = require('tmp')

chai.should()
chai.use(sinonChai)

const timesheetLogger = require('../src/timesheetLogger.js')

describe('calculate (rounded) time from moment', () => {
  describe('entries match HH:mm', () => {
    it('entries must match HH:mm', () => {
      const currentTime = timesheetLogger.getTimesheetTime()

      currentTime.should.match(/\d{2}:\d{2}/)
    })
  })

  const checkTimesheetCalculation = (currentHour, currentMinute, expectedTimesheetTime) => {
    it(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')} => ${expectedTimesheetTime}`, () => {
      const testMoment = moment().hour(currentHour).minute(currentMinute)

      const currentTime = timesheetLogger.getTimesheetTime(testMoment)

      currentTime.should.equal(expectedTimesheetTime)
    })
  }

  describe('minutes are divisible by three', () => {
    checkTimesheetCalculation(12, 0, '12:00')
    checkTimesheetCalculation(9, 11, '09:12')
    checkTimesheetCalculation(22, 52, '22:54')
  })

  describe('hour is increased if rounded', () => {
    checkTimesheetCalculation(8, 59, '09:00')
    checkTimesheetCalculation(23, 58, '00:00')
  })
})

describe('integration tests with temporary files', () => {
  const doIntegrationTestWithTemporaryTimesheetFile = (testDescription, changesOfTimeularZei, expectedContent) => {
    it(testDescription, () => {
      const timesheetLoggerWithMomentStub = _createTimesheetLoggerWithMomentStub(changesOfTimeularZei)
      const {logChangesToTimesheetCallback, filename} = _logChangesToTemporaryTimesheetCallback(timesheetLoggerWithMomentStub)

      changesOfTimeularZei.forEach(changeOfTimeularZei => {
        logChangesToTimesheetCallback(_createTopSideDataBuffer(changeOfTimeularZei.topSide))
      })

      const actualConent = fs.readFileSync(filename).toString()
      actualConent.should.equal(expectedContent)
    })
  }

  const _createTimesheetLoggerWithMomentStub = (changesOfTimeularZei) => {
    const momentStub = sinon.stub()
    changesOfTimeularZei.forEach((changeOfTimeularZei, index) => {
      momentStub.onCall(index).returns(changeOfTimeularZei.moment)
    })
    return proxyquire('../src/timesheetLogger.js', {
      'moment': momentStub
    })
  }

  const _logChangesToTemporaryTimesheetCallback = (timesheetLoggerWithMomentStub) => {
    const temporaryFile = tmp.fileSync()
    const logChangesToTimesheetCallback = timesheetLoggerWithMomentStub.logChangesToTimesheetCallback(temporaryFile.name)
    return {
      logChangesToTimesheetCallback,
      filename: temporaryFile.name
    }
  }

  const _createTopSideDataBuffer = (topSideValue) => {
    const buffer = new Buffer(1)
    buffer.writeInt8(topSideValue)
    return buffer
  }

  describe('add empty line if Timeular Zei is placed on its base', () => {
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
      {moment: moment().hour(8).minute(30), topSide: timesheetLogger.TOP_SIDE.COFFEE},
      {moment: moment().hour(9).minute(29), topSide: timesheetLogger.TOP_SIDE.MAIL},
      {moment: moment().hour(9).minute(30), topSide: timesheetLogger.TOP_SIDE.CLOCK},
      {moment: moment().hour(10).minute(30), topSide: timesheetLogger.TOP_SIDE.MAIL}
    ], '08:30 - 09:30 top side was COFFEE\n' +
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

  describe('works arbitrary (non-existing) files', () => {
    const logToTimesheetOnGivenFilePath = (filePathParts) => {
      it(filePathParts.join(path.sep), () => {
        const temporaryDirectory = tmp.dirSync({unsafeCleanup: true})
        const temporaryFilePath = path.join(temporaryDirectory.name, ...filePathParts)
        const changesOfTimeularZei = [
          {moment: moment().hour(8).minute(0), topSide: timesheetLogger.TOP_SIDE.MAIL},
          {moment: moment().hour(9).minute(0), topSide: timesheetLogger.TOP_SIDE.CLOCK}
        ]
        const timesheetLoggerWithStubbedMomentLibrary = _createTimesheetLoggerWithMomentStub(changesOfTimeularZei)
        const logChangesToTimesheetCallback = timesheetLoggerWithStubbedMomentLibrary.logChangesToTimesheetCallback(temporaryFilePath)

        for (let i = 0; i < changesOfTimeularZei.length; i++) {
          logChangesToTimesheetCallback(_createTopSideDataBuffer(changesOfTimeularZei[i].topSide))
        }

        const actualConent = fs.readFileSync(temporaryFilePath).toString()
        actualConent.should.equal('08:00 - 09:00 top side was MAIL\n')
      })
    }

    logToTimesheetOnGivenFilePath(['file'])
    logToTimesheetOnGivenFilePath(['file.temp'])
    logToTimesheetOnGivenFilePath(['folder', 'file'])
    logToTimesheetOnGivenFilePath(['folder', 'file.temp'])
    logToTimesheetOnGivenFilePath(['folder', 'subfolder', 'file'])
    logToTimesheetOnGivenFilePath(['folder', 'subfolder', 'file.temp'])
  })

  doIntegrationTestWithTemporaryTimesheetFile('end-to-end test', [
    {moment: moment().hour(8).minute(0), topSide: timesheetLogger.TOP_SIDE.MAIL},
    {moment: moment().hour(8).minute(15), topSide: timesheetLogger.TOP_SIDE.A},
    {moment: moment().hour(9).minute(0), topSide: timesheetLogger.TOP_SIDE.CLOCK},
    {moment: moment().hour(9).minute(15), topSide: timesheetLogger.TOP_SIDE.A},
    {moment: moment().hour(9).minute(45), topSide: timesheetLogger.TOP_SIDE.TOP},
    {moment: moment().hour(10).minute(0), topSide: timesheetLogger.TOP_SIDE.A},
    {moment: moment().hour(11).minute(59), topSide: timesheetLogger.TOP_SIDE.B},
    {moment: moment().hour(13).minute(0), topSide: timesheetLogger.TOP_SIDE.BOTTOM},
    {moment: moment().hour(14).minute(0), topSide: timesheetLogger.TOP_SIDE.B},
    {moment: moment().hour(14).minute(0), topSide: timesheetLogger.TOP_SIDE.C},
    {moment: moment().hour(15).minute(52), topSide: timesheetLogger.TOP_SIDE.D},
    {moment: moment().hour(16).minute(0), topSide: timesheetLogger.TOP_SIDE.A}
  ], '08:00 - 08:15 top side was MAIL\n' +
    '08:15 - 09:00 top side was A\n' +
    '09:00 - 09:15 top side was CLOCK\n' +
    '09:15 - 09:45 top side was A\n' +
    '\n' +
    '10:00 - 12:00 top side was A\n' +
    '12:00 - 13:00 top side was B\n' +
    '\n' +
    '14:00 - 15:54 top side was C\n' +
    '15:54 - 16:00 top side was D\n'
  )
})
