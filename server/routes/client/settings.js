import api from "../../api"
import collection from "../../collection"
import model from "../../model"
import config from "../../config/beluga"
import assert, { is_array } from "../../assert"

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
	fastify.next("/settings/favorites", async (app, req, res) => {
		const session = await fastify.session.start(req, res)
		const csrf_token = await fastify.csrf_token(req, res, session)
		const logged_in = await fastify.logged_in(req, res, session)
		if (!logged_in) {
			return fastify.error(app, req, res, 404)
		}

		const media_favorites = await collection.v1.account.favorite.media.list(fastify.mongo.db, { "user_id": logged_in.id })
		const media_history = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
		const emoji_favorites = await model.v1.account.favorite.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
		assert(is_array(media_favorites), "@media_favorites must be an array")
		assert(is_array(media_history), "@media_history must be an array")
		assert(is_array(emoji_favorites), "@emoji_favorites must be an array")

		app.render(req.req, res.res, `/${fastify.device_type(req)}/default/settings/favorites`, {
			csrf_token, logged_in, media_favorites, media_history, emoji_favorites
		})
	})
	fastify.next("/settings/two_factor_authentication", async (app, req, res) => {
		const session = await fastify.session.start(req, res)
		const csrf_token = await fastify.csrf_token(req, res, session)
		const logged_in = await fastify.logged_in(req, res, session)
		if (!logged_in) {
			return fastify.error(app, req, res, 404)
		}
		app.render(req.req, res.res, `/${fastify.device_type(req)}/default/settings/two_factor_authentication`, {
			csrf_token, logged_in
		})
	})
	fastify.next("/settings/desktop", async (app, req, res) => {
		const session = await fastify.session.start(req, res)
		const csrf_token = await fastify.csrf_token(req, res, session)
		const logged_in = await fastify.logged_in(req, res, session)
		if (!logged_in) {
			return fastify.error(app, req, res, 404)
		}
		app.render(req.req, res.res, `/${fastify.device_type(req)}/default/settings/desktop`, {
			csrf_token, logged_in
		})
	})
	fastify.next("/settings/access_token", async (app, req, res) => {
		const session = await fastify.session.start(req, res)
		const csrf_token = await fastify.csrf_token(req, res, session)
		const logged_in = await fastify.logged_in(req, res, session)
		if (!logged_in) {
			return fastify.error(app, req, res, 404)
		}
		const access_tokens = await model.v1.access_token.list(fastify.mongo.db, {
			"user_id": logged_in.id
		})
		app.render(req.req, res.res, `/${fastify.device_type(req)}/default/settings/access_token`, {
			csrf_token, logged_in, access_tokens
		})
	})
	next()
}