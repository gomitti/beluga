import api from "../../api"
import storage from "../../config/storage"
import config from "../../config/beluga"
import logger from "../../logger"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/media/image/upload`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}

			const user = await api.v1.user.show(fastify.mongo.db, { "id": session.user_id })
			if (!user) {
				throw new Error("不正なユーザーです")
			}

			if (!req.body.data || typeof req.body.data !== "string") {
				throw new Error("画像がありません")
			}

			const base64_components = req.body.data.split(",")
			const base64_data = base64_components.length == 2 ? base64_components[1] : req.body.data
			const data = new Buffer(base64_data, "base64");

			const remote = storage.servers[0]
			const urls = await api.v1.media.image.upload(fastify.mongo.db, {
				data, 
				"user_id": user.id, 
				"storage": remote
			})

			res.send({ "success": true, urls })
		} catch (error) {
			logger.log({
				"level": "error",
				"stack": error.stack ? error.stack.split("\n") : null,
				error,
			})
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/media/video/upload`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}

			const user = await api.v1.user.show(fastify.mongo.db, { "id": session.user_id })
			if (!user) {
				throw new Error("不正なユーザーです")
			}

			if (!req.body.data || typeof req.body.data !== "string") {
				throw new Error("動画がありません")
			}

			const base64_components = req.body.data.split(",")
			const base64_data = base64_components.length == 2 ? base64_components[1] : req.body.data
			const data = new Buffer(base64_data, "base64")

			const remote = storage.servers[0]
			const urls = await api.v1.media.video.upload(fastify.mongo.db, {
				data,
				"user_id": user.id,
				"storage": remote
			})

			res.send({ "success": true, urls })
		} catch (error) {
			logger.log({
				"level": "error",
				"stack": error.stack ? error.stack.split("\n") : null,
				error,
			})
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}