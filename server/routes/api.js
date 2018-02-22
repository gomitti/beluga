import { sha256 } from "js-sha256"

module.exports = (fastify, options, next) => {
	// fastify.addHook("preHandler")はどうやらfastify.postした数だけ呼ばれるみたいなのでhookは使わない
	fastify.decorate("authenticate_session", async (req, res, _csrf_token) => {
		const session = await fastify.session.start(req, res)
		const true_csrf_token = sha256(session.id)
		const csrf_token = _csrf_token ? _csrf_token : req.body.csrf_token
		if (csrf_token !== true_csrf_token) {
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
	// const api_version = "v1"
	// fastify.post("/api/v1/statuses/hashtag", (req, res) => {
	// 	const db = fastify.mongo.db
	// 	const collection = db.collection("statuses")
	// 	let success = false
	// 	let statuses = []
	// 	collection
	// 		.find({}, { sort: { "created_at": -1 }, limit: 30 })
	// 		.toArray()
	// 		.then(documents => {
	// 			statuses = documents
	// 			success = true
	// 		}).catch(error => {
	// 			success = false
	// 		}).then(document => {
	// 			res.send({ success, statuses })
	// 		})
	// })
	fastify.register(require("./api/account"))
	fastify.register(require("./api/hashtag"))
	fastify.register(require("./api/media"))
	fastify.register(require("./api/status"))
	fastify.register(require("./api/server"))
	fastify.register(require("./api/user"))
	fastify.register(require("./api/timeline"))
	fastify.register(require("./api/like"))
	fastify.register(require("./api/favorite"))
	fastify.register(require("./api/reaction"))
	next()
}