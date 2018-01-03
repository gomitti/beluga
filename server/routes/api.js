import { sha256 } from "js-sha256"
import * as beluga from "../api"

module.exports = (fastify, options, next) => {
	// fastify.addHook("preHandler")はどうやらfastify.postした数だけ呼ばれるみたいなのでhookは使わない
	fastify.decorate("authenticate_session", async (req, res) => {
		const session = await fastify.session.start(req, res)
		const true_csrf_token = sha256(session.id)
		if (req.body.csrf_token !== true_csrf_token) {
			throw new Error("ページの有効期限が切れました。ページを更新してください。")
		}
		return session
	})
	fastify.decorate("parse_bool", value => {
		if (typeof value === "boolean") {
			return value
		}
		if (typeof value === "string") {
			if (value === "false") {
				return false
			}
			if (value === "true") {
				return true
			}
		}
		if (typeof value === "number") {
			if (value === 0) {
				return false
			}
			if (value === 1) {
				return true
			}
		}
		return false
	})
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
	fastify.register(require("./api/account"))
	fastify.register(require("./api/status"))
	fastify.register(require("./api/server"))
	fastify.register(require("./api/hashtag"))
	fastify.register(require("./api/timeline"))
	next()
}