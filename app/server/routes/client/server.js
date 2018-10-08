import config from "../../config/beluga"
import model from "../../model"
import memcached from "../../memcached"
import timeline from "../../timeline"
import collection from "../../collection"
import assert, { is_array } from "../../assert"
import { try_convert_to_object_id } from "../../lib/object_id"

const compare_shortname = (a, b) => {
    if (a < b) {
        return -1
    }
    if (a > b) {
        return 1
    }
    return 0
}

const restore_columns = async (db, user_id, pathname) => {
    pathname = pathname.replace(/[#?].+$/, "")
    const stored_columns = await memcached.v1.kvs.restore(db, {
        "user_id": user_id,
        "key": `columns_${pathname}`
    })
    if (stored_columns === null) {
        return []
    }
    assert(is_array(stored_columns), "$stored_columns must be of type array")
    return stored_columns
}

module.exports = (fastify, options, next) => {
    // オンラインのユーザーを取得
    fastify.decorate("members", async (server, logged_in) => {
        const online_user_ids = fastify.online.users(server)
        const member = []
        let including_me = false
        for (const user_id of online_user_ids) {
            const user = await model.v1.user.show(fastify.mongo.db, { "id": user_id })
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
    fastify.next("/server/create", async (app, req, res) => {
        const csrf_token = await fastify.csrf_token(req, res)
        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/create`, { csrf_token })
    })
    fastify.next("/server/:server_name/hashtags", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in = await fastify.logged_in(req, res, session)

            const server_name = req.params.server_name
            const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }

            const joined_hashtags = await collection.v1.hashtags.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })
            assert(Array.isArray(joined_hashtags), "$hashtags must be of type array")

            const server_hashtags = await model.v1.server.hashtags(fastify.mongo.db, { "id": server.id })
            assert(Array.isArray(server_hashtags), "$hashtags must be of type array")

            server.members = await fastify.members(server, logged_in)
            assert(Array.isArray(server.members), "$server.members must be of type array")
            fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/hashtags`, {
                csrf_token, server, logged_in, joined_hashtags, server_hashtags, device,
                "platform": fastify.platform(req),
                "request_query": req.query
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/server/:server_name/about", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in = await fastify.logged_in(req, res, session)

            const server_name = req.params.server_name
            const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }

            server.members = await fastify.members(server, logged_in)
            assert(Array.isArray(server.members), "$server.members must be of type array")
            fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/about`, {
                csrf_token, server, logged_in, device,
                "platform": fastify.platform(req),
                "request_query": req.query
            })
        } catch (error) {
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/server/:server_name/:tagname", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in = await fastify.logged_in(req, res, session)

            if (logged_in === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const server_name = req.params.server_name
            const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }

            const tagname = req.params.tagname
            const hashtag = await model.v1.hashtag.show(fastify.mongo.db, {
                "server_id": server.id, tagname
            })
            if (hashtag === null) {
                return fastify.error(app, req, res, 404)
            }


            const { originalUrl } = req.raw
            const stored_columns = await restore_columns(fastify.mongo.db, logged_in.id, originalUrl)
            if (stored_columns.length == 0) {
                stored_columns.push({
                    "param_ids": {
                        "hashtag_id": hashtag.id,
                    },
                    "type": "hashtag"
                })
            }
            const columns = await fastify.build_columns(stored_columns, logged_in, null, hashtag, null, null)

            const joined_hashtags = await collection.v1.hashtags.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })
            assert(Array.isArray(joined_hashtags), "$hashtags must be of type array")

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in.id,
                "key": "desktop_settings"
            })

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
            const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "server_id": server.id })

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)

            server.members = await fastify.members(server, logged_in)
            assert(Array.isArray(server.members), "$server.members must be of type array")
            fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/hashtag`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, server, hashtag, logged_in, joined_hashtags, device, desktop_settings,
                columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/server/:server_name/notifications", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in = await fastify.logged_in(req, res, session)

            if (logged_in === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const server_name = req.params.server_name
            const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }

            const { originalUrl } = req.raw
            const stored_columns = await restore_columns(fastify.mongo.db, logged_in.id, originalUrl)
            if (stored_columns.length == 0) {
                stored_columns.push({
                    "param_ids": {},
                    "type": "notifications"
                })
            }
            const columns = await fastify.build_columns(stored_columns, logged_in, server, null, null, null)

            const joined_hashtags = await collection.v1.hashtags.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })
            assert(Array.isArray(joined_hashtags), "$hashtags must be of type array")

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in.id,
                "key": "desktop_settings"
            })

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
            const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "server_id": server.id })

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)

            server.members = await fastify.members(server, logged_in)
            assert(Array.isArray(server.members), "$server.members must be of type array")
            fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/notifications`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, server, logged_in, joined_hashtags, device, desktop_settings,
                columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/server/:server_name/thread/:in_reply_to_status_id", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in = await fastify.logged_in(req, res, session)

            if (logged_in === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const server_name = req.params.server_name
            const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }

            const in_reply_to_status_id = req.params.in_reply_to_status_id
            const in_reply_to_status = await collection.v1.status.show(fastify.mongo.db, {
                "id": in_reply_to_status_id,
                "trim_user": false,
                "trim_server": false,
                "trim_hashtag": false,
                "trim_recipient": false,
                "trim_favorited_by": false,
                "trim_commenters": false,
                "requested_by": logged_in.id
            })
            if (in_reply_to_status === null) {
                return fastify.error(app, req, res, 404)
            }

            const { originalUrl } = req.raw
            const stored_columns = await restore_columns(fastify.mongo.db, logged_in.id, originalUrl)
            if (stored_columns.length == 0) {
                stored_columns.push({
                    "param_ids": {
                        "in_reply_to_status_id": in_reply_to_status.id,
                    },
                    "type": "thread"
                })
            }
            const columns = await fastify.build_columns(stored_columns, logged_in, null, null, null, in_reply_to_status)

            const joined_hashtags = await collection.v1.hashtags.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })
            assert(Array.isArray(joined_hashtags), "$hashtags must be of type array")

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in.id,
                "key": "desktop_settings"
            })

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
            const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "server_id": server.id })

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)

            server.members = await fastify.members(server, logged_in)
            assert(Array.isArray(server.members), "$server.members must be of type array")
            fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/thread`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, server, in_reply_to_status, logged_in, joined_hashtags, device, desktop_settings,
                columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/server/:server_name/@:user_name", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in = await fastify.logged_in(req, res, session)

            if (logged_in === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const server_name = req.params.server_name
            const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }
            const user = await model.v1.user.show(fastify.mongo.db, {
                "name": req.params.user_name
            })
            if (user === null) {
                return fastify.error(app, req, res, 404)
            }

            const { originalUrl } = req.raw
            const stored_columns = await restore_columns(fastify.mongo.db, logged_in.id, originalUrl)
            if (stored_columns.length == 0) {
                stored_columns.push({
                    "param_ids": {
                        "user_id": user.id,
                        "server_id": server.id,
                    },
                    "type": "home"
                })
            }
            const columns = await fastify.build_columns(stored_columns, logged_in, null, null, user, null)

            const joined_hashtags = await collection.v1.hashtags.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })
            assert(Array.isArray(joined_hashtags), "$hashtags must be of type array")

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in.id,
                "key": "desktop_settings"
            })

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
            const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "server_id": server.id })

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)

            server.members = await fastify.members(server, logged_in)
            assert(Array.isArray(server.members), "$server.members must be of type array")
            fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/home`, {
                "platform": fastify.platform(req),
                "request_query": req.query, 
                csrf_token, server, user, logged_in, joined_hashtags, device, desktop_settings,
                columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next(`/server/:server_name/statuses`, async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in = await fastify.logged_in(req, res, session)

            if (logged_in === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const server_name = req.params.server_name
            const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }

            const { originalUrl } = req.raw
            const stored_columns = await restore_columns(fastify.mongo.db, logged_in.id, originalUrl)
            if (stored_columns.length == 0) {
                stored_columns.push({
                    "param_ids": {
                        "server_id": server.id
                    },
                    "type": "server"
                })
            }
            const columns = await fastify.build_columns(stored_columns, logged_in, server, null, null, null)

            const joined_hashtags = await collection.v1.hashtags.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })
            assert(Array.isArray(joined_hashtags), "$hashtags must be of type array")

            server.members = await fastify.members(server, logged_in)
            assert(Array.isArray(server.members), "$server.members must be of type array")

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in.id,
                "key": "desktop_settings"
            })

            // オンラインを更新
            fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
            const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "server_id": server.id })

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/statuses`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, server, logged_in, joined_hashtags, device, desktop_settings,
                columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames
            })
        } catch (error) {
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/server/:server_name/settings/profile", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }

        const server_name = req.params.server_name
        const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
        if (server === null) {
            return fastify.error(app, req, res, 404)
        }

        if (logged_in.id.equals(server.created_by) === false) {
            return fastify.error(app, req, res, 404)
        }

        const profile_image_size = config.server.profile.image_size
        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/settings/profile`, {
            csrf_token, profile_image_size, logged_in, device, server,
            "platform": fastify.platform(req),
        })
    })
    next()
}