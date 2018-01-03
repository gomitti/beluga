import * as beluga from "../../api"

module.exports = (fastify, options, next) => {
	fastify.next("/hashtag/:server_name/create", async (app, req, res) => {
		const csrf_token = await fastify.csrf_token(req, res)
		const server_name = req.params.server_name
		const server = await beluga.v1.server.show(fastify.mongo.db, { "name": server_name })
		if (server === null) {
			return fastify.error(app, req, res, 404)
		}
		app.render(req.req, res.res, `/${fastify.device_type(req)}/hashtag/create`, {
			csrf_token, server
		})
	})
	next()
}