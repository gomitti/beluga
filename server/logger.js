import config from "./config/beluga"
const path = require("path");
const winston = require("winston")

export default winston.createLogger({
	"level": "info",
	"format": winston.format.json(),
	"transports": [
		new winston.transports.File({
			"filename": path.join(config.log.directory, "error.log"),
			"level": "error"
		})
	]
})