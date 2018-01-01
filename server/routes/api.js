import * as beluga from "../api"

module.exports = (fastify, options, next) => {
	const websocket = options.websocket
	fastify.decorate("websocket_broadcast", (name, data) => {
		if (websocket.ws == undefined) {
			return
		}
		websocket.ws.clients.forEach(client => {
			client.send(JSON.stringify({
				[name]: data
			}))
		})
	})
	const api_version = "v1"
	fastify.post(`/api/${api_version}/status/update`, async (req, res) => {
		try {
			const result = await beluga.v1.status.update(fastify.mongo.db, req.body)
			fastify.websocket_broadcast("status_updated", {})
			res.send({ "success": true })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post("/api/v1/statuses/hashtag", (req, res) => {
		const db = fastify.mongo.db
		const collection = db.collection("statuses")
		let success = false
		let statuses = []
		collection
			.find({}, { sort: { "created_at": -1 }, limit: 30 })
			.toArray()
			.then(documents => {
				statuses = documents
				success = true
			}).catch(error => {
				success = false
			}).then(document => {
				res.send({ success, statuses })
			})
	})
	fastify.post(`/api/${api_version}/user/signup`, async (req, res) => {
		const ip_address = req.headers["x-real-ip"]
		const params = Object.assign({ ip_address }, req.body)
		try {
			const result = await beluga.v1.user.signup(fastify.mongo.db, params)
			res.send({ "success": true })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/user/signin`, async (req, res) => {
		try {
			const success = await beluga.v1.user.signin(fastify.mongo.db, req.body)
			if (success !== true) {
				throw new Error("パスワードが間違っています")
			}
			res.send({ "success": true })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}