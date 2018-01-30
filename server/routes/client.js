import { sha256 } from "js-sha256"
import api from "../api"
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
			return await api.v1.user.show(fastify.mongo.db, { "id": session.user_id })
		} catch (error) {
			return null
		}
	})
	fastify.decorate("theme", req => {
		const ua = req.headers["user-agent"];
		if (ua.match(/mobile/i)) {
			return "common"
		}
		return "default"
	})
	fastify.decorate("platform", req => {
		const ua = req.headers["user-agent"];
		if (ua.match(/mac/i)) {
			return "mac"
		}
		return "win"
	})
	fastify.register(require("./client/account"))
	fastify.register(require("./client/server"))
	fastify.register(require("./client/hashtag"))
	fastify.register(require("./client/settings"))
	fastify.register(require("./client/color"))

	fastify.next("/", async (app, req, res) => {
		const logged_in = await fastify.logged_in(req, res)
		const db = fastify.mongo.db
		const collection = db.collection("hashtags")
		const rows = await collection.find({}).toArray()
		const hashtags = []
		for (const hashtag of rows) {
			const server = await api.v1.server.show(db, { "id": hashtag.server_id })
			if(!server){
				continue
			}
			hashtag.server = server
			hashtags.push(hashtag)
		}
		app.render(req.req, res.res, `/${fastify.device_type(req)}/common/`, { hashtags, logged_in })
	})
	// Nextは.jsを動的に生成するため、最初の1回はここで生成する
	// 2回目以降はNginxのproxy_cacheが効くのでここは呼ばれない
	fastify.get("/_next/*", (req, res) => {
		handle(req.req, res.res)
	})
	next()
}