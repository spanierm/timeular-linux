const moment = require("moment");
const fs = require("fs");

TopSide = {
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

  of: (value) => {
    switch (value) {
      case 0:
        return "TOP";
      case 5:
        return "COFFEE";
      case 6:
        return "MAIL";
      case 7:
        return "CHAT";
      case 8:
        return "CLOCK";
      case 1:
        return "D";
      case 2:
        return "A";
      case 3:
        return "B";
      case 4:
        return "C";
      case 9:
        return "BOTTOM_TIP";
    }
  }
};

TimesheetTimeFormat = "HH:mm";

_startTime = moment().format(TimesheetTimeFormat);
_topSide = TopSide.TOP;

_timesheetPath = `${moment().format("YYYY_MM/DD")}.times`;

logChangesToTimesheet = (data, isNotification) => {
  const endTime = moment().format(TimesheetTimeFormat);
  fs.appendFileSync(_timesheetPath, `${startTime} - ${endTime}: top side was ${TopSide.of(topSide)}\n`);
  _topSide = data.readUInt8(0);
  _startTime = endTime;
};

getTimesheetTime = (someMoment = moment()) => {
  const timesheetMoment = _areMinutesDivisibleByThree(someMoment) ? someMoment : _roundMinutesUpToBeDivisibleByThree(someMoment);
  return timesheetMoment.format(TimesheetTimeFormat)
};

_areMinutesDivisibleByThree = (timesheetMoment) => {
  return timesheetMoment.minutes() % 3 === 0;
};

_roundMinutesUpToBeDivisibleByThree = (timesheetMoment) => {
  const minutesModThree = timesheetMoment.minutes() % 3;
  return timesheetMoment.add(3 - minutesModThree, "minutes")
};

module.exports = {
  TopSide,
  logChangesToTimesheet,
  getTimesheetTime
};
