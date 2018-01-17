import config from "../../config/beluga"

module.exports = (fastify, options, next) => {
	fastify.next("/colors", async (app, req, res) => {
		const csrf_token = await fastify.csrf_token(req, res)
		app.render(req.req, res.res, `/${fastify.device_type(req)}/common/colors`, { "colors": config.colors })
	})
	fastify.next("/gradients", async (app, req, res) => {
		const csrf_token = await fastify.csrf_token(req, res)
		app.render(req.req, res.res, `/${fastify.device_type(req)}/common/gradients`, { "gradients": config.gradients })
	})
	next()
}