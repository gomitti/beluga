import beluga from "../../api"
import { hash } from "bcrypt/bcrypt";

module.exports = (fastify, options, next) => {
	fastify.next("/server/create", async (app, req, res) => {
		const csrf_token = await fastify.csrf_token(req, res)
		app.render(req.req, res.res, `/${fastify.device_type(req)}/server/create`, { csrf_token })
	})
	fastify.next("/server/:server_name/:tagname", async (app, req, res) => {
		try {
			const session = await fastify.session.start(req, res)
			const csrf_token = await fastify.csrf_token(req, res, session)
			const logged_in = await fastify.logged_in(req, res, session)

			const server_name = req.params.server_name
			const server = await beluga.v1.server.show(fastify.mongo.db, { "name": server_name })
			if (server === null) {
				return fastify.error(app, req, res, 404)
			}
			const tagname = req.params.tagname
			const hashtag = await beluga.v1.hashtag.show(fastify.mongo.db, {
				"server_id": server.id, tagname
			})
			if (hashtag === null) {
				return fastify.error(app, req, res, 404)
			}
			const statuses = await beluga.v1.timeline.hashtag(fastify.mongo.db, Object.assign({
				"id": hashtag.id,
				"trim_user": false,
			}, req.body))
			app.render(req.req, res.res, `/${fastify.device_type(req)}/server/hashtag`, {
				csrf_token, server, hashtag, statuses, logged_in
			})
		} catch (error) {
			return fastify.error(app, req, res, 500)
		}
	})
	next()
}