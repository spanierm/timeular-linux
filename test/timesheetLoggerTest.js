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

const topSides = [
  {sticker: 'TOP', message: ''},
  {sticker: 'D', message: 'message: D'},
  {sticker: 'A', message: 'message: A'},
  {sticker: 'B', message: 'message: B'},
  {sticker: 'C', message: 'message: C'},
  {sticker: 'GEAR', message: 'message: GEAR'},
  {sticker: 'MAIL', message: 'message: MAIL'},
  {sticker: 'CHAT', message: 'message: CHAT'},
  {sticker: 'CLOCK', message: 'message: CLOCK'},
  {sticker: 'BOTTOM', message: ''}
]

const breaks = topSides.map(topSide => topSide.message).filter(message => !message, (_, index) => index)

const topSidesReverseMapping = (() => {
  const reverseMapping = {}
  topSides.forEach((topSide, index) => {
    reverseMapping[topSide.sticker] = index
  })
  return reverseMapping
})()

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
      const {logChangesToTimesheetCallback, timesheetPath} = _logChangesToTemporaryTimesheetCallback(timesheetLoggerWithMomentStub)

      changesOfTimeularZei.forEach(changeOfTimeularZei => {
        logChangesToTimesheetCallback(_createTopSideDataBuffer(changeOfTimeularZei.sticker))
      })

      const actualConent = fs.readFileSync(timesheetPath, 'utf8')
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
    const timesheetPath = tmp.fileSync().name
    const topSideDefinitionPath = _createTemporaryFileWithTopSideDefinition()
    const logChangesToTimesheetCallback = timesheetLoggerWithMomentStub.logChangesToTimesheetCallback(timesheetPath, topSideDefinitionPath)
    return {
      logChangesToTimesheetCallback,
      timesheetPath
    }
  }

  const _createTemporaryFileWithTopSideDefinition = () => {
    const topSideDefinitionPath = tmp.fileSync().name
    fs.writeFileSync(topSideDefinitionPath, JSON.stringify(topSides))
    return topSideDefinitionPath
  }

  const _createTopSideDataBuffer = (topSideValue) => {
    const buffer = new Buffer(1)
    buffer.writeInt8(topSideValue)
    return buffer
  }

  describe('add empty line if Timeular Zei is placed on its base', () => {
    breaks.forEach((topSide) => {
      doIntegrationTestWithTemporaryTimesheetFile(`top side is ${topSidesReverseMapping[topSide]}`, [
        {moment: moment().hour(11).minute(0), sticker: topSidesReverseMapping['MAIL']},
        {moment: moment().hour(12).minute(0), sticker: topSide},
        {moment: moment().hour(13).minute(0), sticker: topSidesReverseMapping['A']},
        {moment: moment().hour(14).minute(0), sticker: topSidesReverseMapping['B']},
      ], '11:00 - 12:00 message: MAIL\n' +
        '\n' +
        '13:00 - 14:00 message: A\n'
      )
    })
  })

  describe('skip entries if time did not change', () => {
    doIntegrationTestWithTemporaryTimesheetFile('same minute', [
      {moment: moment().hour(8).minute(30), sticker: topSidesReverseMapping['MAIL']},
      {moment: moment().hour(8).minute(30), sticker: topSidesReverseMapping['CHAT']},
      {moment: moment().hour(9).minute(30), sticker: topSidesReverseMapping['MAIL']}
    ], '08:30 - 09:30 message: CHAT\n')

    doIntegrationTestWithTemporaryTimesheetFile('same minute after rounding', [
      {moment: moment().hour(8).minute(28), sticker: topSidesReverseMapping['MAIL']},
      {moment: moment().hour(8).minute(30), sticker: topSidesReverseMapping['GEAR']},
      {moment: moment().hour(9).minute(29), sticker: topSidesReverseMapping['MAIL']},
      {moment: moment().hour(9).minute(30), sticker: topSidesReverseMapping['CLOCK']},
      {moment: moment().hour(10).minute(30), sticker: topSidesReverseMapping['MAIL']}
    ], '08:30 - 09:30 message: GEAR\n' +
      '09:30 - 10:30 message: CLOCK\n')

    doIntegrationTestWithTemporaryTimesheetFile('for breaks as well', [
      {moment: moment().hour(8).minute(28), sticker: topSidesReverseMapping['TOP']},
      {moment: moment().hour(8).minute(30), sticker: topSidesReverseMapping['BOTTOM']},
      {moment: moment().hour(9).minute(0), sticker: topSidesReverseMapping['MAIL']},
      {moment: moment().hour(9).minute(29), sticker: topSidesReverseMapping['TOP']},
      {moment: moment().hour(9).minute(30), sticker: topSidesReverseMapping['CLOCK']},
      {moment: moment().hour(10).minute(30), sticker: topSidesReverseMapping['MAIL']}
    ], '\n' +
      '09:00 - 09:30 message: MAIL\n' +
      '09:30 - 10:30 message: CLOCK\n')
  })

  describe('works arbitrary (non-existing) files', () => {
    const logToTimesheetOnGivenFilePath = (filePathParts) => {
      it(filePathParts.join(path.sep), () => {
        const changesOfTimeularZei = [
          {moment: moment().hour(8).minute(0), sticker: topSidesReverseMapping['MAIL']},
          {moment: moment().hour(9).minute(0), sticker: topSidesReverseMapping['CLOCK']}
        ]
        const temporaryDirectory = tmp.dirSync({unsafeCleanup: true}).name
        const temporaryFilePath = path.join(temporaryDirectory, ...filePathParts)
        const topSideDefinition = _createTemporaryFileWithTopSideDefinition()
        const timesheetLoggerWithMomentStub = _createTimesheetLoggerWithMomentStub(changesOfTimeularZei)
        const logChangesToTimesheetCallback = timesheetLoggerWithMomentStub.logChangesToTimesheetCallback(temporaryFilePath, topSideDefinition)

        for (let i = 0; i < changesOfTimeularZei.length; i++) {
          logChangesToTimesheetCallback(_createTopSideDataBuffer(changesOfTimeularZei[i].sticker))
        }

        const actualConent = fs.readFileSync(temporaryFilePath).toString()
        actualConent.should.equal('08:00 - 09:00 message: MAIL\n')
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
    {moment: moment().hour(8).minute(0), sticker: topSidesReverseMapping['MAIL']},
    {moment: moment().hour(8).minute(15), sticker: topSidesReverseMapping['A']},
    {moment: moment().hour(9).minute(0), sticker: topSidesReverseMapping['CLOCK']},
    {moment: moment().hour(9).minute(15), sticker: topSidesReverseMapping['A']},
    {moment: moment().hour(9).minute(45), sticker: topSidesReverseMapping['TOP']},
    {moment: moment().hour(10).minute(0), sticker: topSidesReverseMapping['A']},
    {moment: moment().hour(11).minute(59), sticker: topSidesReverseMapping['B']},
    {moment: moment().hour(13).minute(0), sticker: topSidesReverseMapping['BOTTOM']},
    {moment: moment().hour(14).minute(0), sticker: topSidesReverseMapping['B']},
    {moment: moment().hour(14).minute(0), sticker: topSidesReverseMapping['C']},
    {moment: moment().hour(15).minute(52), sticker: topSidesReverseMapping['D']},
    {moment: moment().hour(16).minute(0), sticker: topSidesReverseMapping['A']}
  ], '08:00 - 08:15 message: MAIL\n' +
    '08:15 - 09:00 message: A\n' +
    '09:00 - 09:15 message: CLOCK\n' +
    '09:15 - 09:45 message: A\n' +
    '\n' +
    '10:00 - 12:00 message: A\n' +
    '12:00 - 13:00 message: B\n' +
    '\n' +
    '14:00 - 15:54 message: C\n' +
    '15:54 - 16:00 message: D\n'
  )

  describe('change the top side definition while running the program', () => {
    const updateTopSideMessagesFile = (topSideDefinitionPath) => {
      const currentTopSides = JSON.parse(fs.readFileSync(topSideDefinitionPath, 'utf8'))
      const newTopSides = []
      currentTopSides.forEach(topSide => {
        if (topSide.message) {
          topSide.message += '_new'
        }
        newTopSides.push(topSide)
      })
      fs.writeFileSync(topSideDefinitionPath, JSON.stringify(newTopSides, undefined, 2))
    }

    it('change top side definition file while logging to timesheet', () => {
      const timesheetPath = tmp.fileSync().name
      const topSideDefinitionPath = _createTemporaryFileWithTopSideDefinition()
      const changesOfTimeularZei = [
        {moment: moment().hour(8).minute(0), sticker: topSidesReverseMapping['MAIL']},
        {moment: moment().hour(9).minute(0), sticker: topSidesReverseMapping['CLOCK']},
        {moment: moment().hour(9).minute(22), sticker: topSidesReverseMapping['GEAR']},
        {moment: moment().hour(9).minute(53), sticker: topSidesReverseMapping['CHAT']}
      ]
      const timesheetLoggerWithMomentStub = _createTimesheetLoggerWithMomentStub(changesOfTimeularZei)
      const logChangesToTimesheetCallback = timesheetLoggerWithMomentStub.logChangesToTimesheetCallback(timesheetPath, topSideDefinitionPath)
      changesOfTimeularZei.forEach(changeOfTimeularZei => {
        logChangesToTimesheetCallback(_createTopSideDataBuffer(changeOfTimeularZei.sticker))
        updateTopSideMessagesFile(topSideDefinitionPath)
      })

      const actualConent = fs.readFileSync(timesheetPath).toString()

      const expectedContent = '08:00 - 09:00 message: MAIL_new\n' +
        '09:00 - 09:24 message: CLOCK_new_new\n' +
        '09:24 - 09:54 message: GEAR_new_new_new\n'
      actualConent.should.equal(expectedContent)
    })
  })
})
