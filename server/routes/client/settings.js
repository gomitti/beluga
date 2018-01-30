import api from "../../api"
import config from "../../config/beluga"

module.exports = (fastify, options, next) => {
	fastify.next("/settings/profile", async (app, req, res) => {
		const csrf_token = await fastify.csrf_token(req, res)
		const profile_image_size = config.user.profile.image.size
		app.render(req.req, res.res, `/${fastify.device_type(req)}/default/settings/profile`, {
			csrf_token, profile_image_size
		})
	})
	next()
}