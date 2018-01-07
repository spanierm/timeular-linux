const {createLogger, format, transports} = require('winston')
const {align, combine, printf, timestamp} = format

const getLogger = (level = 'info', logToConsole = true, logToFile) => {
  return createLogger({
    format: combine(
      align(),
      timestamp(),
      printf(info => {
        return `${info.timestamp} ${info.level}: ${info.message}`
      })
    ),
    level: level,
    transports: _createTransports(logToConsole, logToFile)
  })
}

const _createTransports = (logToConsole, logToFile) => {
  let transportsToCreate = []
  if (logToConsole) {
    transportsToCreate.push(new transports.Console())
  }
  if (logToFile) {
    transportsToCreate.push(new transports.File(logToFile))
  }
  return transportsToCreate
}

module.exports = {
  getLogger
}
