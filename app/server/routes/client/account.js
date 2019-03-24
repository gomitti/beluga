import model from "../../model"
import memcached from "../../memcached"
import collection from "../../collection"
import timeline from "../../timeline"
import assign from "../../lib/assign"

const compare_shortname = (a, b) => {
    if (a < b) {
        return -1
    }
    if (a > b) {
        return 1
    }
    return 0
}

module.exports = (fastify, options, next) => {
    fastify.next("/signup", async (app, req, res) => {
        const csrf_token = await fastify.csrf_token(req, res)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/account/signup`, { csrf_token })
    })
    fastify.next("/login", async (app, req, res) => {
        const csrf_token = await fastify.csrf_token(req, res)
        const { redirect } = req.query
        if (redirect) {
            if (!!redirect.match(/^\/.+$/) === false) {
                return fastify.error(app, req, res, 404)
            }
        }
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/account/login`, {
            csrf_token, "request_query": req.query
        })
    })
    fastify.next("/notifications/mentions", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)

            if (logged_in_user === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in_user.id,
                "key": "desktop_settings"
            })
            const { originalUrl } = req.raw
            const initial_column = {
                "param_ids": {},
                "type": "notifications"
            }

            const statuses = await timeline.v1.notifications(fastify.mongo.db, assign(req.query, {
                "user_id": logged_in_user.id,
            }))

            const { has_newer_statuses, has_older_statuses, needs_redirect } = await fastify.generate_pagination_flags(
                memcached.v1.statuses.community.count, {
                    "recipient_id": logged_in_user.id
                }, req.query)

            if (needs_redirect) {
                return res.redirect(`/notifications`)
            }

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const muted_words = await model.v1.mute.words.list(fastify.mongo.db, { "user_id": logged_in_user.id })

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in_user.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const custom_emoji_list = []

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)
            const custom_emoji_version = "0"

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/account/notifications/mentions`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, logged_in_user, device, desktop_settings, statuses,
                pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                custom_emoji_version, muted_users, muted_words, has_newer_statuses, has_older_statuses
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/notifications/threads", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)

            if (logged_in_user === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in_user.id,
                "key": "desktop_settings"
            })
            const { originalUrl } = req.raw
            const initial_column = {
                "param_ids": {},
                "type": "notifications"
            }

            const statuses = await timeline.v1.notifications(fastify.mongo.db, assign(req.query, {
                "user_id": logged_in_user.id,
            }))

            const { has_newer_statuses, has_older_statuses, needs_redirect } = await fastify.generate_pagination_flags({
                "in_reply_to_user_id": logged_in_user.id
            }, req.query)

            if (needs_redirect) {
                return res.redirect(`/notifications`)
            }

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const muted_words = await model.v1.mute.words.list(fastify.mongo.db, { "user_id": logged_in_user.id })

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in_user.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const custom_emoji_list = []

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)
            const custom_emoji_version = "0"

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/account/notifications/threads`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, logged_in_user, device, desktop_settings, statuses,
                pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                custom_emoji_version, muted_users, muted_words, has_newer_statuses, has_older_statuses
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/notifications", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)

            if (logged_in_user === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in_user.id,
                "key": "desktop_settings"
            })

            const statuses = await timeline.v1.notifications(fastify.mongo.db, assign(req.query, {
                "user_id": logged_in_user.id,
                "trim_user": false,
                "trim_community": false,
                "trim_channel": false,
                "trim_favorited_by": false,
                "trim_recipient": false,
                "trim_commenters": false,
                "trim_reaction_users": false,
                "count": req.query.count ? parseInt(req.query.count) : 30
            }))

            const { has_newer_statuses, has_older_statuses, needs_redirect } = await fastify.generate_pagination_flags(
                memcached.v1.statuses.notifications.count, {
                    "user_id": logged_in_user.id
                }, req.query)


            if (needs_redirect) {
                return res.redirect(`/notifications`)
            }

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const muted_words = await model.v1.mute.words.list(fastify.mongo.db, { "user_id": logged_in_user.id })

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in_user.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const custom_emoji_list = []

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)
            const custom_emoji_version = "0"

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/account/notifications/all`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, logged_in_user, device, desktop_settings, statuses,
                pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                custom_emoji_version, muted_users, muted_words, has_newer_statuses, has_older_statuses
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/@:user_name", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)

            if (logged_in_user === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const recipient = await memcached.v1.user.show(fastify.mongo.db, {
                "name": req.params.user_name
            })
            if (recipient === null) {
                return fastify.error(app, req, res, 404)
            }

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in_user.id,
                "key": "desktop_settings"
            })

            const statuses = await timeline.v1.message(fastify.mongo.db, assign(req.query, {
                "recipient_id": recipient.id,
                "trim_user": false,
                "trim_community": false,
                "trim_channel": false,
                "trim_favorited_by": false,
                "trim_recipient": false,
                "trim_commenters": false,
                "trim_reaction_users": false,
                "count": req.query.count ? parseInt(req.query.count) : 30
            }))

            const { has_newer_statuses, has_older_statuses, needs_redirect } = await fastify.generate_pagination_flags(
                memcached.v1.statuses.message.count, {
                    "recipient_id": recipient.id
                }, req.query)


            if (needs_redirect) {
                return res.redirect(`/@${recipient.name}`)
            }

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const muted_words = await model.v1.mute.words.list(fastify.mongo.db, { "user_id": logged_in_user.id })

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in_user.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const custom_emoji_list = []

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)
            const custom_emoji_version = "0"

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/account/message`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, logged_in_user, device, desktop_settings, statuses, recipient,
                pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                custom_emoji_version, muted_users, muted_words, has_newer_statuses, has_older_statuses
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    next()
}