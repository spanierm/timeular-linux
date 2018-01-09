const moment = require('moment')
const path = require('path')

const consoleLogger = require('./consoleLogger')
const timesheetLogger = require('./timesheetLogger')
const zei = require('./zei')

const TIMESHEET_DIR = process.env['TIMESHEET_DIR']
const TIMESHEET_PATH = path.join(TIMESHEET_DIR, moment().format('YYYY_MM'), `${moment().format('DD')}.times`)
const TOP_SIDE_DEFINITION_PATH = path.join(TIMESHEET_DIR, 'timeular-zei.json')

const logChangesToTimesheetCallback = timesheetLogger.logChangesToTimesheetCallback(TIMESHEET_PATH, TOP_SIDE_DEFINITION_PATH)
zei.subscribeToCharacteristics((data, isNotification) => {
  consoleLogger.logOrientationChangesToConsole(data, isNotification)
  logChangesToTimesheetCallback(data, isNotification)
})
