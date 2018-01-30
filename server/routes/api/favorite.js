import model from "../../model"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/favorite/create`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const params = Object.assign({}, req.body, { "user_id": session.user_id })
			const status = await model.v1.favorite.create(fastify.mongo.db, params)
			fastify.websocket_broadcast("favorites_updated", { status })
			res.send({ "success": true, status })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/favorite/destroy`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const params = Object.assign({}, req.body, { "user_id": session.user_id })
			const status = await model.v1.favorite.destroy(fastify.mongo.db, params)
			fastify.websocket_broadcast("favorites_updated", { status })
			res.send({ "success": true, status })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}