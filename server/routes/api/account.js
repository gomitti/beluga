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
			if (!session.user_id) {
				throw new Error("ログインしてください")
			}

			const server = storage.servers[0]
			const url = await model.v1.account.avatar.reset(fastify.mongo.db, session.user_id, server)
			res.send({ "success": true, "profile_image_url": url })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/account/avatar/update`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!session.user_id) {
				throw new Error("ログインしてください")
			}

			if (!req.body.data || typeof req.body.data !== "string") {
				throw new Error("画像がありません")
			}

			const base64_components = req.body.data.split(",")
			const base64_data = base64_components.length == 2 ? base64_components[1] : req.body.data
			const data = new Buffer(base64_data, "base64");

			const server = storage.servers[0]
			const url = await model.v1.account.avatar.update(fastify.mongo.db, {
				data,
				"user_id": session.user_id
			}, server)
			res.send({ "success": true, "profile_image_url": url })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}