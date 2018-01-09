const fs = require('fs')
const mkdirp = require('mkdirp')
const moment = require('moment')
const path = require('path')

const log = require('./logFactory').getLogger()

const TIMESHEET_TIME_FORMAT = 'HH:mm'

const getTimesheetTime = (someMoment = moment()) => {
  const timesheetMoment = _areMinutesDivisibleByThree(someMoment)
    ? someMoment
    : _roundMinutesUpToBeDivisibleByThree(someMoment)
  return timesheetMoment.format(TIMESHEET_TIME_FORMAT)
}

const _areMinutesDivisibleByThree = timesheetMoment => {
  return timesheetMoment.minutes() % 3 === 0
}

const _roundMinutesUpToBeDivisibleByThree = timesheetMoment => {
  const minutesModThree = timesheetMoment.minutes() % 3
  return timesheetMoment.add(3 - minutesModThree, 'minutes')
}

let lastChange

const logChangesToTimesheetCallback = (timesheetFile, topSideDefinitionPath) => {
  // eslint-disable-next-line no-unused-vars
  return (data, isNotification) => {
    const currentTime = getTimesheetTime()
    if (_shouldTrack(lastChange, currentTime)) {
      if (_isBreak(lastChange.topSide)) {
        _writeToTimesheet(timesheetFile, '\n')
      }
      else {
        const topSideDefinition = JSON.parse(fs.readFileSync(topSideDefinitionPath, 'utf8'))
        _writeToTimesheet(timesheetFile, `${lastChange.time} - ${currentTime} ${topSideDefinition[lastChange.topSide].message}\n`)
      }
    }
    lastChange = {
      time: currentTime,
      topSide: data.readUInt8(0)
    }
  }
}

const _shouldTrack = (lastChange, currentTime) => {
  if (!lastChange) {
    log.debug('Skipping timesheet entry for initial change')
    return false
  }
  else {
    if (lastChange.time === currentTime) {
      log.debug('Skipping timesheet entry since the time did not change')
      return false
    }
    else {
      return true
    }
  }
}

const _writeToTimesheet = (timesheetPath, data) => {
  if (fs.existsSync(timesheetPath)) {
    fs.appendFileSync(timesheetPath, data)
  }
  else {
    mkdirp.sync(path.dirname(timesheetPath))
    fs.writeFileSync(timesheetPath, data)
  }
}

const _isBreak = topSide => {
  const topTip = 0
  const bottomTip = 9
  return topSide === topTip || topSide === bottomTip
}

module.exports = {
  TIMESHEET_TIME_FORMAT,
  getTimesheetTime,
  logChangesToTimesheetCallback
}
