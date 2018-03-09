import api from "../../api"
import model from "../../model"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/hashtag/create`, async (req, res) => {
		try {
			const session = await fastify.authenticate(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const params = Object.assign({}, req.body, { "user_id": session.user_id })
			const hashtag = await api.v1.hashtag.create(fastify.mongo.db, params)
			res.send({ "success": true, hashtag })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/hashtag/show`, async (req, res) => {
		try {
			const params = Object.assign({}, req.body)
			const hashtag = await model.v1.hashtag.show(fastify.mongo.db, params)
			res.send({ "success": true, hashtag })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}