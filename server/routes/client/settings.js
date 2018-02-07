import api from "../../api"
import collection from "../../collection"
import config from "../../config/beluga"

module.exports = (fastify, options, next) => {
	fastify.next("/settings/profile", async (app, req, res) => {
		const session = await fastify.session.start(req, res)
		const csrf_token = await fastify.csrf_token(req, res, session)
		const logged_in = await fastify.logged_in(req, res, session)
		if (!logged_in) {
			return fastify.error(app, req, res, 404)
		}

		const profile_image_size = config.user.profile.image_size
		app.render(req.req, res.res, `/${fastify.device_type(req)}/default/settings/profile`, {
			csrf_token, profile_image_size, logged_in
		})
	})
	fastify.next("/settings/design", async (app, req, res) => {
		const session = await fastify.session.start(req, res)
		const csrf_token = await fastify.csrf_token(req, res, session)
		const logged_in = await fastify.logged_in(req, res, session)
		if (!logged_in) {
			return fastify.error(app, req, res, 404)
		}

		app.render(req.req, res.res, `/${fastify.device_type(req)}/default/settings/design`, {
			csrf_token, logged_in
		})
	})
	fastify.next("/settings/account", async (app, req, res) => {
		const session = await fastify.session.start(req, res)
		const csrf_token = await fastify.csrf_token(req, res, session)
		const logged_in = await fastify.logged_in(req, res, session)
		if (!logged_in) {
			return fastify.error(app, req, res, 404)
		}

		app.render(req.req, res.res, `/${fastify.device_type(req)}/default/settings/account`, {
			csrf_token, logged_in
		})
	})
	fastify.next("/settings/bookmark", async (app, req, res) => {
		const session = await fastify.session.start(req, res)
		const csrf_token = await fastify.csrf_token(req, res, session)
		const logged_in = await fastify.logged_in(req, res, session)
		if (!logged_in) {
			return fastify.error(app, req, res, 404)
		}
		const media_bookmark = await collection.v1.account.bookmark.media.list(fastify.mongo.db, { "user_id": logged_in.id })
		const media_history = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
		app.render(req.req, res.res, `/${fastify.device_type(req)}/default/settings/bookmark`, {
			csrf_token, logged_in,
			"media": {
				"bookmark": media_bookmark,
				"history": media_history
			}
		})
	})
	next()
}