const consoleLogger = require('./consoleLogger')
const timesheetLogger = require('./timesheetLogger')
const zei = require('./zei')

const moment = require('moment')
const path = require('path')
const tmp = require('tmp')
const TIMESHEET_DIR = path.dirname(tmp.fileSync({keep: true}).name)
const TIMESHEET_PATH = path.join(TIMESHEET_DIR, moment().format('YYYY_MM'), `${moment().format('DD')}.times`)

zei.subscribeToCharacteristics((data, isNotification) => {
  consoleLogger.logOrientationChangesToConsole(data, isNotification)
  timesheetLogger.logChangesToTimesheetCallback(TIMESHEET_PATH)(data, isNotification)
})

// todo read Messages from file
