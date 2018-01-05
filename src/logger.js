const {createLogger, format, transports} = require('winston')
const {combine, printf, timestamp} = format

const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`
})

module.exports = createLogger({
  format: combine(
    timestamp(),
    myFormat
  ),
  level: 'debug',
  transports: [new transports.Console()]
})
