import model from "../../model"
import memcached from "../../memcached"

module.exports = (fastify, options, next) => {
	// オンラインのユーザーを取得
	fastify.decorate("members", async (server, logged_in) => {
		const online_user_ids = fastify.online.users(server)
		const member = []
		let including_me = false
		for (const user_id of online_user_ids) {
			const user = await memcached.v1.user.show(fastify.mongo.db, { "id": user_id })
			if (user) {
				member.push(user)
				if (logged_in && user.id.equals(logged_in.id)) {
					including_me = true
				}
			}
		}
		if (logged_in && including_me === false) {
			member.push(logged_in)
		}
		return member
	})
	let api_version = "v1"
	fastify.post(`/api/${api_version}/server/create`, async (req, res) => {
		try {
			const session = await fastify.authenticate(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const params = Object.assign({ "user_id": session.user_id }, req.body)
			const server = await model.v1.server.create(fastify.mongo.db, params)
			res.send({ "success": true, server })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.post(`/api/${api_version}/server/members`, async (req, res) => {
		try {
			const session = await fastify.authenticate(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const server = await memcached.v1.server.show(fastify.mongo.db, { "name": req.body.name })
			const members = await fastify.members(server, null)
			res.send({ "success": true, members })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}