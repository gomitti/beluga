import config from "./config/beluga"
import path from "path"
import winston from "winston"

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