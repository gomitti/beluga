import collection from "../../collection"
import model from "../../model"
import memcached from "../../memcached"
import config from "../../config/beluga"
import assert, { is_array } from "../../assert"

module.exports = (fastify, options, next) => {
    fastify.next("/settings/profile", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }

        let pinned_emoji = null
        if (logged_in) {
            pinned_emoji = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
            assert(Array.isArray(pinned_emoji), "$pinned_emoji must be of type array")
        }

        const profile_image_size = config.user.profile.image_size
        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/settings/profile`, {
            csrf_token, profile_image_size, logged_in, device, pinned_emoji,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/settings/design", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }

        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/settings/design`, {
            csrf_token, logged_in, device,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/settings/account", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }

        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/settings/account`, {
            csrf_token, logged_in, device,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/settings/pins", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }

        const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in.id })
        const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
        const pinned_emoji = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })

        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/settings/pins`, {
            csrf_token, logged_in, pinned_media, recent_uploads, pinned_emoji, device,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/settings/authenticator", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }
        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/settings/authenticator`, {
            csrf_token, logged_in, device,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/settings/desktop", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }

        const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
            "user_id": logged_in.id,
            "key": "desktop_settings"
        })

        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/settings/desktop`, {
            csrf_token, logged_in, device, desktop_settings,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/settings/access_token", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }
        const access_tokens = await model.v1.access_token.list(fastify.mongo.db, {
            "user_id": logged_in.id
        })
        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/settings/access_token`, {
            csrf_token, logged_in, access_tokens, device,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/settings/uploads", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }

        const media = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
        const aggregation_result = await model.v1.media.aggregate(fastify.mongo.db, { "user_id": logged_in.id })
        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/settings/uploads`, {
            csrf_token, logged_in, device, media, aggregation_result,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/settings/mute", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }
        const users = await memcached.v1.users.list(fastify.mongo.db, {})
        const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in.id })
        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/settings/mute`, {
            csrf_token, logged_in, device, users, muted_users,
            "platform": fastify.platform(req),
        })
    })
    next()
}