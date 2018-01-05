const fs = require('fs')
const moment = require('moment')

const TOP_SIDE = {
  TOP: 0,
  COFFEE: 5,
  MAIL: 6,
  CHAT: 7,
  CLOCK: 8,
  D: 1,
  A: 2,
  B: 3,
  C: 4,
  BOTTOM: 9,

  of: value => {
    switch (value) {
      case 0:
        return 'TOP'
      case 5:
        return 'COFFEE'
      case 6:
        return 'MAIL'
      case 7:
        return 'CHAT'
      case 8:
        return 'CLOCK'
      case 1:
        return 'D'
      case 2:
        return 'A'
      case 3:
        return 'B'
      case 4:
        return 'C'
      case 9:
        return 'BOTTOM'
    }
  }
}

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

const logChangesToTimesheetCallback = timesheetPath => {
  // eslint-disable-next-line no-unused-vars
  return (data, isNotification) => {
    const currentTime = getTimesheetTime()
    if (lastChange) {
      if (_shouldNotTrack(lastChange.topSide)) {
        fs.appendFileSync(timesheetPath, '\n')
      } else {
        if (lastChange.time !== currentTime) {
          fs.appendFileSync(
            timesheetPath,
            `${lastChange.time} - ${currentTime} top side was ${TOP_SIDE.of(
              lastChange.topSide
            )}\n`
          )
        }
      }
    }
    lastChange = {
      time: currentTime,
      topSide: data.readUInt8(0)
    }
  }
}

const _shouldNotTrack = topSide => {
  return topSide === TOP_SIDE.TOP || topSide === TOP_SIDE.BOTTOM
}

module.exports = {
  TIMESHEET_TIME_FORMAT,
  TOP_SIDE,
  getTimesheetTime,
  logChangesToTimesheetCallback
}
