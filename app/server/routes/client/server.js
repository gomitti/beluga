import config from "../../config/beluga"
import api from "../../api"
import model from "../../model"
import memcached from "../../memcached"
import timeline from "../../timeline"
import collection from "../../collection"
import assert, { is_array } from "../../assert"
import { try_convert_to_object_id } from "../../lib/object_id"
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
    fastify.decorate("online_members", async (server, logged_in) => {
        const online_user_ids = fastify.websocket_bridge.get_users_by_server(server)
        const member = []
        let including_me = false
        for (let j = 0; j < online_user_ids.length; j++) {
            const user_id = online_user_ids[j]
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
    fastify.decorate("generate_pagination_flags", async (count_query, request_query, redirect_func) => {
        let has_newer_statuses = false
        let has_older_statuses = false
        const expected_count = request_query.count ? request_query.count : config.timeline.default_count
        if (request_query.since_id) {
            const count = await api.v1.statuses.count(fastify.mongo.db, assign(count_query, {
                "since_id": request_query.since_id
            }))
            if (count < expected_count) {
                return redirect_func()
            }
            has_newer_statuses = true
            has_older_statuses = true
        } else {
            if (request_query.max_id) {
                const count = await api.v1.statuses.count(fastify.mongo.db, assign(count_query, {
                    "max_id": request_query.max_id
                }))
                if (count > expected_count) {
                    has_older_statuses = true
                }
                has_newer_statuses = true
            } else {
                const count = await api.v1.statuses.count(fastify.mongo.db, count_query)
                if (count > expected_count) {
                    has_older_statuses = true
                }
            }
        }
        return { has_newer_statuses, has_older_statuses }
    })
    fastify.next("/server/create", async (app, req, res) => {
        const csrf_token = await fastify.csrf_token(req, res)
        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/create`, { csrf_token })
    })
    fastify.next("/server/:server_name/join", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }

        const { server_name } = req.params
        const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name, "requested_by": logged_in.id })
        if (server === null) {
            return fastify.error(app, req, res, 404)
        }

        const { redirect } = req.query
        if (redirect && !!redirect.match(/^\/[\w\/@]+$/) === false) {
            return fastify.error(app, req, res, 404)
        }
        if (server.joined === true) {
            if (redirect) {
                return res.redirect(redirect)
            }
            return fastify.error(app, req, res, 404)
        }

        const members = await model.v1.server.members(fastify.mongo.db, { "id": server.id })

        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/server/join`, {
            csrf_token, server, logged_in, members,
            "platform": fastify.platform(req),
            "request_query": req.query
        })
    })
    fastify.next("/server/:server_name/channels", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in = await fastify.logged_in(req, res, session)

            const server_name = req.params.server_name
            const server = await model.v1.server.show(fastify.mongo.db, {
                "name": server_name,
                "requested_by": logged_in.id
            })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }
            if (server.joined !== true) {
                return res.redirect(`/server/${server.name}/join?redirect=${req.raw.originalUrl}`)
            }

            const joined_channels = await collection.v1.channels.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })

            const server_channels = await model.v1.server.channels(fastify.mongo.db, { "id": server.id })
            assert(Array.isArray(server_channels), "$channels must be of type array")

            server.online_members = await fastify.online_members(server, logged_in)
            fastify.websocket_broadcast("online_members_changed", {})

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/channels`, {
                csrf_token, server, logged_in, joined_channels, server_channels, device,
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

            server.online_members = await fastify.online_members(server, logged_in)
            fastify.websocket_broadcast("online_members_changed", {})

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
    // チャンネル
    fastify.next("/server/:server_name/:name", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in = await fastify.logged_in(req, res, session)

            if (logged_in === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const server_name = req.params.server_name
            const server = await model.v1.server.show(fastify.mongo.db, {
                "name": server_name,
                "requested_by": logged_in.id
            })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }
            if (server.joined !== true) {
                return res.redirect(`/server/${server.name}/join?redirect=${req.raw.originalUrl}`)
            }

            const name = req.params.name
            const channel = await model.v1.channel.show(fastify.mongo.db, {
                "server_id": server.id, name
            })
            if (channel === null) {
                return fastify.error(app, req, res, 404)
            }

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in.id,
                "key": "desktop_settings"
            })
            const { originalUrl } = req.raw
            const initial_column = {
                "param_ids": {
                    "channel_id": channel.id,
                },
                "type": "channel"
            }
            const stored_columns = (desktop_settings && desktop_settings.multiple_columns_enabled) ? await restore_columns(fastify.mongo.db, logged_in.id, originalUrl) : []
            const columns = await fastify.build_columns(stored_columns, initial_column, logged_in, req.query)

            const { has_newer_statuses, has_older_statuses } = await fastify.generate_pagination_flags({
                "channel_id": channel.id,
            }, req.query, () => {
                res.redirect(`/server/${server.name}/${channel.name}`)
            })

            const joined_channels = await collection.v1.channels.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in.id })
            const muted_words = []

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
            const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "server_id": server.id })

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)

            server.online_members = await fastify.online_members(server, logged_in)
            fastify.websocket_broadcast("online_members_changed", {})

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/channel`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, server, channel, logged_in, joined_channels, device, desktop_settings,
                columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                muted_users, muted_words, has_newer_statuses, has_older_statuses
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
            const columns = await fastify.build_columns(stored_columns, logged_in, server)

            const joined_channels = await collection.v1.channels.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in.id })
            const muted_words = []

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

            server.online_members = await fastify.online_members(server, logged_in)
            fastify.websocket_broadcast("online_members_changed", {})

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/notifications`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, server, logged_in, joined_channels, device, desktop_settings,
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
            const server = await model.v1.server.show(fastify.mongo.db, {
                "name": server_name,
                "requested_by": logged_in.id
            })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }
            if (server.joined !== true) {
                return res.redirect(`/server/${server.name}/join?redirect=${req.raw.originalUrl}`)
            }

            const in_reply_to_status_id = req.params.in_reply_to_status_id
            const in_reply_to_status = await collection.v1.status.show(fastify.mongo.db, {
                "id": in_reply_to_status_id,
                "trim_user": false,
                "trim_server": false,
                "trim_channel": false,
                "trim_recipient": false,
                "trim_favorited_by": false,
                "trim_commenters": false,
                "requested_by": logged_in.id
            })
            if (in_reply_to_status === null) {
                return fastify.error(app, req, res, 404)
            }

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in.id,
                "key": "desktop_settings"
            })

            const { originalUrl } = req.raw
            const initial_column = {
                "param_ids": {
                    "in_reply_to_status_id": in_reply_to_status.id,
                },
                "type": "thread"
            }
            const stored_columns = (desktop_settings && desktop_settings.multiple_columns_enabled) ? await restore_columns(fastify.mongo.db, logged_in.id, originalUrl) : []
            const columns = await fastify.build_columns(stored_columns, initial_column, logged_in, req.query)

            const joined_channels = await collection.v1.channels.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })

            const { has_newer_statuses, has_older_statuses } = await fastify.generate_pagination_flags({
                "in_reply_to_status_id": in_reply_to_status.id,
            }, req.query, () => {
                res.redirect(`/server/${server.name}/thread/${in_reply_to_status.id}`)
            })

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in.id })
            const muted_words = []

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
            const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "server_id": server.id })

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)

            server.online_members = await fastify.online_members(server, logged_in)
            fastify.websocket_broadcast("online_members_changed", {})

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/thread`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, server, in_reply_to_status, logged_in, joined_channels, device, desktop_settings,
                columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                muted_users, muted_words, has_newer_statuses, has_older_statuses
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
            const server = await model.v1.server.show(fastify.mongo.db, {
                "name": server_name,
                "requested_by": logged_in.id
            })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }
            if (server.joined !== true) {
                return res.redirect(`/server/${server.name}/join?redirect=${req.raw.originalUrl}`)
            }

            const user = await model.v1.user.show(fastify.mongo.db, {
                "name": req.params.user_name
            })
            if (user === null) {
                return fastify.error(app, req, res, 404)
            }

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in.id,
                "key": "desktop_settings"
            })

            const { originalUrl } = req.raw
            const initial_column = {
                "param_ids": {
                    "user_id": user.id,
                    "server_id": server.id,
                },
                "type": "home"
            }
            const stored_columns = (desktop_settings && desktop_settings.multiple_columns_enabled) ? await restore_columns(fastify.mongo.db, logged_in.id, originalUrl) : []
            const columns = await fastify.build_columns(stored_columns, initial_column, logged_in, req.query)

            const joined_channels = await collection.v1.channels.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })

            const { has_newer_statuses, has_older_statuses } = await fastify.generate_pagination_flags({
                "user_id": user.id,
                "server_id": server.id,
            }, req.query, () => {
                res.redirect(`/server/${server.name}/@${user.name}`)
            })

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in.id })
            const muted_words = []

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
            const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "server_id": server.id })

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)

            server.online_members = await fastify.online_members(server, logged_in)
            fastify.websocket_broadcast("online_members_changed", {})

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/server/home`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, server, user, logged_in, joined_channels, device, desktop_settings,
                columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                muted_users, muted_words, has_newer_statuses, has_older_statuses
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
            const server = await model.v1.server.show(fastify.mongo.db, {
                "name": server_name,
                "requested_by": logged_in.id
            })
            if (server === null) {
                return fastify.error(app, req, res, 404)
            }
            if (server.joined !== true) {
                return res.redirect(`/server/${server.name}/join?redirect=${req.raw.originalUrl}`)
            }

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in.id,
                "key": "desktop_settings"
            })

            const { originalUrl } = req.raw
            const initial_column = {
                "param_ids": {
                    "server_id": server.id
                },
                "type": "server"
            }
            const stored_columns = (desktop_settings && desktop_settings.multiple_columns_enabled) ? await restore_columns(fastify.mongo.db, logged_in.id, originalUrl) : []
            const columns = await fastify.build_columns(stored_columns, initial_column, logged_in, req.query)

            const joined_channels = await collection.v1.channels.joined(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": logged_in.id
            })

            const { has_newer_statuses, has_older_statuses } = await fastify.generate_pagination_flags({
                "server_id": server.id,
            }, req.query, () => {
                res.redirect(`/server/${server.name}/statuses`)
            })

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in.id })
            const muted_words = []
            server.online_members = await fastify.online_members(server, logged_in)

            // オンラインを更新
            fastify.websocket_broadcast("online_members_changed", {})

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
                csrf_token, server, logged_in, joined_channels, device, desktop_settings,
                columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                muted_users, muted_words, has_newer_statuses, has_older_statuses
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
    fastify.next("/server/:server_name/create_new_channel", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }

        const { server_name } = req.params
        const server = await memcached.v1.server.show(fastify.mongo.db, { "name": server_name })
        if (server === null) {
            return fastify.error(app, req, res, 404)
        }
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/channel/create`, {
            csrf_token, server, logged_in
        })
    })
    next()
}