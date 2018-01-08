import beluga from "../../api"
import storage from "../../config/storage"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/status/update`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const params = Object.assign({}, req.body, { "user_id": session.user_id })
			const status = await beluga.v1.status.update(fastify.mongo.db, params)
			if (!!status.hashtag_id) {
				const hashtag = await beluga.v1.hashtag.show(fastify.mongo.db, { "id": status.hashtag_id })
				status.hashtag = hashtag
			}
			status.user = await beluga.v1.user.show(fastify.mongo.db, { "id": status.user_id })
			fastify.websocket_broadcast("status_updated", { status })
			res.send({ "success": true, status })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}