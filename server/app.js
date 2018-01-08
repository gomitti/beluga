const mongodb = require("mongodb")
const app = require("fastify")()
const websocket = require("./websocket")
import mongo from "./mongo"
import config from "./config/beluga"

mongodb.MongoClient
	.connect(mongo.url)
	.then(client => {
		const db = client.db(mongo.database.production)
		app.register(require("fastify-mongodb"), {
			client: db
		})
		app.register(require("fastify-cookie"))
		app.register(require("./session"), {
			"secret": config.auth.session.cookie_secret,
			"cookie_name": config.auth.session.cookie_name,
			"timezone_offset": config.auth.session.timezone_offset,
			"cookie_options": {
				"http_only": true,
				"same_site": true,
				"secure": config.auth.session.secure,
				"max_age": config.auth.session.max_age
			}
		})
		app.register(require("./routes/api"), { websocket })
		app.register(require("fastify-react"))
			.after(() => {
				app.decorate("device_type", req => {
					var ua = req.headers["user-agent"];
					if (ua.match(/mobile/i)) {
						return "mobile"
					}
					return "desktop"
				})
				app.register(require("./routes/client"))
			})

		app.listen(config.port.app, (error) => {
			if (error) {
				throw error
			}
		})

		websocket.listen(config.port.websocket, (error) => {
			if (error) {
				throw error
			}
		})
	})
	.catch(error => {
		throw error
	})