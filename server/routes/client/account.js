module.exports = (fastify, options, next) => {
	fastify.next("/signup", async (app, req, res) => {
		const csrf_token = await fastify.csrf_token(req, res)
		app.render(req.req, res.res, `/${fastify.device_type(req)}/common/account/signup`, { csrf_token })
	})
	fastify.next("/login", async (app, req, res) => {
		const csrf_token = await fastify.csrf_token(req, res)
		app.render(req.req, res.res, `/${fastify.device_type(req)}/common/account/login`, { csrf_token })
	})
	next()
}