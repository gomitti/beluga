import api from "../../api"
import model from "../../model"
import storage from "../../config/storage"
import assert from "../../assert"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/account/signup`, async (req, res) => {
		try {
			const ip_address = req.headers["x-real-ip"]
			const params = Object.assign({ ip_address }, req.body)
			const session = await fastify.authenticate_session(req, res)
			const user_id = await model.v1.account.signup(fastify.mongo.db, params)
			const user = await model.v1.user.show(fastify.mongo.db, { "id": user_id })
			assert(user, "@user must be object")
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

			const remote = storage.servers[0]
			const url = await model.v1.account.avatar.reset(fastify.mongo.db, {
				"user_id": session.user_id,
				"storage": remote
			})
			res.send({ "success": true, "avatar_url": url })
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

			const remote = storage.servers[0]
			const url = await model.v1.account.avatar.update(fastify.mongo.db, {
				data,
				"user_id": session.user_id,
				"storage": remote
			})
			res.send({ "success": true, "avatar_url": url })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/account/profile/update`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!session.user_id) {
				throw new Error("ログインしてください")
			}
			await model.v1.account.profile.update(fastify.mongo.db, Object.assign({}, req.body, {
				"user_id": session.user_id
			}))
			const user = model.v1.user.show(fastify.mongo.db, { "id": session.user_id })
			res.send({ "success": true, user })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/account/favorite/media/update`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!session.user_id) {
				throw new Error("ログインしてください")
			}
			await model.v1.account.favorite.media.update(fastify.mongo.db, Object.assign({}, req.body, {
				"user_id": session.user_id
			}))
			res.send({ "success": true })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/account/favorite/emoji/update`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!session.user_id) {
				throw new Error("ログインしてください")
			}
			await model.v1.account.favorite.emoji.update(fastify.mongo.db, Object.assign({}, req.body, {
				"user_id": session.user_id
			}))
			res.send({ "success": true })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/account/profile/background_image/update`, async (req, res) => {
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

			const remote = storage.servers[0]
			await model.v1.account.background_image.update(fastify.mongo.db, {
				data,
				"user_id": session.user_id,
				"storage": remote
			})
			res.send({ "success": true })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/account/profile/background_image/reset`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!session.user_id) {
				throw new Error("ログインしてください")
			}
			await model.v1.account.background_image.reset(fastify.mongo.db, {
				"user_id": session.user_id,
			})
			res.send({ "success": true })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}