const moment = require("moment");
const should = require("should");
const timesheet = require("../src/timesheet.js");
const tmp = require("tmp");

describe("calculate (rounded) time from moment", () => {
  describe("entries match HH:mm", () => {
    it("entries must match HH:mm", () => {
      const currentTime = timesheet.getTimesheetTime();
      currentTime.should.match(/\d{2}:\d{2}/);
    });
  });

  const checkCalculation = (currentHour, currentMinute, expectedTimesheetTime) => {
    it(`${currentHour}:${currentMinute} => ${expectedTimesheetTime}`, () => {
      const testMoment = moment().hour(currentHour).minute(currentMinute);
      const currentTime = timesheet.getTimesheetTime(testMoment);
      currentTime.should.be.equal(expectedTimesheetTime);
    })
  };

  describe("minutes are divisible by three", () => {
    checkCalculation(12, 0, "12:00");
    checkCalculation(9, 11, "09:12");
    checkCalculation(22, 52, "22:54");
  });

  describe("hour is increased if rounded", () => {
    checkCalculation(8, 59, "09:00");
    checkCalculation(23, 58, "00:00");
  });
});
