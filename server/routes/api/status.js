import api from "../../api"
import model from "../../model"
import storage from "../../config/storage"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/status/update`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const ip_address = req.headers["x-real-ip"]
			const params = Object.assign({ "user_id": session.user_id, ip_address }, req.body)
			const status = await model.v1.status.update(fastify.mongo.db, params)
			if (!!status.hashtag_id) {
				const hashtag = await api.v1.hashtag.show(fastify.mongo.db, { "id": status.hashtag_id })
				status.hashtag = hashtag
			}
			status.user = await api.v1.user.show(fastify.mongo.db, { "id": status.user_id })
			fastify.websocket_broadcast("status_updated", { status })
			res.send({ "success": true, status })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/status/destroy`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const params = Object.assign({ "user_id": session.user_id }, req.body)
			const result = await model.v1.status.destroy(fastify.mongo.db, params)
			fastify.websocket_broadcast("status_deleted", { "id": params.id })
			res.send({ "success": true, "id": params.id })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}