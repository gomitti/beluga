import model from "../../model"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/like/create`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const params = Object.assign({}, req.body, { "user_id": session.user_id })
			await model.v1.like.create(fastify.mongo.db, params)
			const status = await model.v1.status.show(fastify.mongo.db, { "id": params.status_id, "trim_favorited_by": false })
			fastify.websocket_broadcast("like_created", { status })
			res.send({ "success": true, status })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}