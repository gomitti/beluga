import api from "../../api"
import model from "../../model"
import collection from "../../collection"
import storage from "../../config/storage"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/status/update`, async (req, res) => {
		try {
			const session = await fastify.authenticate(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const ip_address = req.headers["x-real-ip"]

			const ua = req.headers["user-agent"];
			const from_mobile = ua.match(/mobile/i) ? true : false

			const params = Object.assign({ "user_id": session.user_id, ip_address, from_mobile }, req.body)
			const status_id = await model.v1.status.update(fastify.mongo.db, params)
			const status = await collection.v1.status.show(fastify.mongo.db, {
				"id": status_id,
				"trim_user": false,
				"trim_recipient": false,
				"trim_server": false,
				"trim_hashtag": false
			})
			fastify.websocket_broadcast("status_updated", { status })
			res.send({ "success": true, status })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/status/destroy`, async (req, res) => {
		try {
			const session = await fastify.authenticate(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const params = Object.assign({ "user_id": session.user_id }, req.body)
			await model.v1.status.destroy(fastify.mongo.db, params)
			fastify.websocket_broadcast("status_deleted", { "id": params.id })
			res.send({ "success": true, "id": params.id })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}