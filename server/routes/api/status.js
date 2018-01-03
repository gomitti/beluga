import * as beluga from "../../api"

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
			fastify.websocket_broadcast("status_updated", {})
			res.send({ "success": true, status })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}