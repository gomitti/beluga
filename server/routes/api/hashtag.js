import beluga from "../../api"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/hashtag/create`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const params = Object.assign({}, req.body, { "user_id": session.user_id })
			const hashtag = await beluga.v1.hashtag.create(fastify.mongo.db, params)
			res.send({ "success": true, hashtag })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}