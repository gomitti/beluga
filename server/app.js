const mongodb = require("mongodb")
const fastify = require("fastify")()
const websocket = require("./websocket")
import * as mongo from "./mongo"

mongodb.MongoClient
	.connect(mongo.url)
	.then(client => {
		const db = client.db(mongo.name)
		fastify.register(require("fastify-mongodb"), {
			client: db
		})

		fastify.register(require("./routes/api"), { websocket })

		fastify
			.register(require("fastify-react"))
			.after(() => {
				fastify.register(require("./routes/client"))
			})

		fastify.listen(3000, (error) => {
			if (error) {
				throw error
			}
			console.log("Beluga running on http://localhost:3000")
		})

		websocket.listen(8080, (error) => {
			if (error) {
				throw error
			}
			console.log("WebSocket server running on http://localhost:8080")
		})
	})
	.catch(error => {
		throw error
	})