import * as beluga from "../../api"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/user/signup`, async (req, res) => {
		try {
			const ip_address = req.headers["x-real-ip"]
			const params = Object.assign({ ip_address }, req.body)
			const session = await fastify.authenticate_session(req, res)
			const result = await beluga.v1.user.signup(fastify.mongo.db, params)
			res.send({ "success": true })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/user/signin`, async (req, res) => {
		try {
			let session = await fastify.authenticate_session(req, res)
			const user = await beluga.v1.user.signin(fastify.mongo.db, req.body)
			// セッションを再生成
			await fastify.session.destroy(res, session)
			session = await fastify.session.generate(res, user._id)
			res.send({ "user": true })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}