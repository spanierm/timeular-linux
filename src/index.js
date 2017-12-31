const zei = require("./zei");
const consoleLogger = require("./consoleLogger");

zei.subscribeToCharacteristics(consoleLogger.logOrientationChangesToConsole);
