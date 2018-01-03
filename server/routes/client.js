import { sha256 } from "js-sha256"
import * as beluga from "../api"
const next = require("next")
const dev = process.env.NODE_ENV !== "production"
const handle = next({ dev }).getRequestHandler()

module.exports = (fastify, options, next) => {
	fastify.decorate("error", (app, req, res, code) => {
		res.res.statusCode = code;
		return app.render(req.req, res.res, "/_error", { code })
	})
	fastify.decorate("csrf_token", async (req, res, session) => {
		if (!session) {
			session = await fastify.session.start(req, res)
		}
		return sha256(session.id)
	})
	fastify.decorate("logged_in", async (req, res, session) => {
		if (!session) {
			session = await fastify.session.start(req, res)
		}
		if (!session.user_id) {
			return null
		}
		try {
			return await beluga.v1.user.show(fastify.mongo.db, { "id": session.user_id })
		} catch (error) {
			return null
		}
	})
	fastify.register(require("./client/account"))
	fastify.register(require("./client/server"))
	fastify.register(require("./client/hashtag"))

	fastify.next("/", async (app, req, res) => {
		const logged_in = await fastify.logged_in(req, res)
		const db = fastify.mongo.db
		const collection = db.collection("hashtags")
		const hashtags = await collection.find({}).toArray()
		for (const hashtag of hashtags) {
			const server = await beluga.v1.server.show(db, { "id": hashtag.server_id })
			hashtag.server = server
		}
		app.render(req.req, res.res, `/${fastify.device_type(req)}/`, { hashtags, logged_in })
	})
	// Nextは.jsを動的に生成するため、最初の1回はここで生成する
	// 2回目以降はNginxのproxy_cacheが効くのでここは呼ばれない
	fastify.get("/_next/*", (req, res) => {
		handle(req.req, res.res)
	})
	next()
}