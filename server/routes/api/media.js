import beluga from "../../api"
import storage from "../../config/storage"
import config from "../../config/beluga"
const fileType = require('file-type');
const path = require('path');
const uid = require("uid-safe").sync
const fs = require("fs")
const winston = require("winston")

const logger = winston.createLogger({
	"level": "info",
	"format": winston.format.json(),
	"transports": [
		new winston.transports.File({
			"filename": path.join(config.log.path, "error.log"), 
			"level": "error"
		})
	]
})

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/media/image/upload`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}

			const user = await beluga.v1.user.show(fastify.mongo.db, { "id": session.user_id })
			if (!user) {
				throw new Error("不正なユーザーです")
			}

			const base64_components = req.body.data.split(",")
			const base64_data = base64_components.length == 2 ? base64_components[1] : req.body.data
			const data = new Buffer(base64_data, "base64");
			const type = fileType(data)
			if (!type) {
				throw new Error("このファイル形式には対応していません")
			}
			if (type.ext !== "jpg" && type.ext !== "png" && type.ext !== "gif") {
				throw new Error("このファイル形式には対応していません")
			}

			const server = storage.servers[0]
			const result = await beluga.v1.media.image.upload(fastify.mongo.db, data, {
				"ext": type.ext
			}, user, server)

			const protocol = server.https ? "https" : "http"

			const urls = {
				"original": `${protocol}://${server.url_prefix}.${server.domain}/${result.original}`,
				"square": `${protocol}://${server.url_prefix}.${server.domain}/${result.square}`,
				"small": result.small ? `${protocol}://${server.url_prefix}.${server.domain}/${result.small}` : null,
				"medium": result.medium ? `${protocol}://${server.url_prefix}.${server.domain}/${result.medium}` : null,
			}

			res.send({ "success": false, urls })
		} catch (error) {
			logger.log({
				"level": "error",
				error
			})
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}