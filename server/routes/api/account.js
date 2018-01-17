import api from "../../api"
import model from "../../model"
import storage from "../../config/storage"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/account/signup`, async (req, res) => {
		try {
			const ip_address = req.headers["x-real-ip"]
			const params = Object.assign({ ip_address }, req.body)
			const session = await fastify.authenticate_session(req, res)
			const user = await model.v1.account.signup(fastify.mongo.db, params)
			// セッションを再生成
			await fastify.session.destroy(res, session)
			await fastify.session.generate(res, user.id)
			res.send({ "success": true, user })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/account/signin`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			const user = await model.v1.account.signin(fastify.mongo.db, req.body)
			// セッションを再生成
			await fastify.session.destroy(res, session)
			await fastify.session.generate(res, user.id)
			res.send({ "success": true })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/account/avatar/reset`, async (req, res) => {
		try {
			let session = await fastify.authenticate_session(req, res)
			const user = await api.v1.user.show(fastify.mongo.db, { "id": session.user_id })
			if (!user) {
				throw new Error("ログインしてください")
			}
			const server = storage.servers[0]
			const url = await api.v1.account.avatar.reset(fastify.mongo.db, user, server)
			res.send({ "user": true, "profile_image_url": url })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}