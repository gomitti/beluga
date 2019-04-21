import config from "../../config/beluga"
import constants from "../../constants"
import api from "../../api"
import model from "../../model"
import memcached from "../../memcached"
import timeline from "../../timeline"
import collection from "../../collection"
import assert, { is_array, is_object } from "../../assert"
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

const map_role_number = {
    "admin": constants.role.admin,
    "moderator": constants.role.moderator,
    "member": constants.role.member,
    "guest": constants.role.guest,
}

module.exports = (fastify, options, next) => {
    fastify.next("/create_new_community", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)
            if (logged_in_user === null) {
                return fastify.error(app, req, res, 404)
            }
            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/community/create`, {
                csrf_token, logged_in_user, device,
                "platform": fastify.platform(req),
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/communities", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)

            const communities = await collection.v1.communities.list(fastify.mongo.db)

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/communities`, {
                csrf_token, communities, logged_in_user, device,
                "platform": fastify.platform(req),
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/:community_name/channels", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)
            if (logged_in_user === null) {
                return fastify.error(app, req, res, 404)
            }

            const { community_name } = req.params
            const community = await model.v1.community.show(fastify.mongo.db, {
                "name": community_name,
                "requested_by": logged_in_user.id
            })
            if (community === null) {
                return fastify.error(app, req, res, 404)
            }

            const joined_channels = await collection.v1.channels.joined(fastify.mongo.db, {
                "community_id": community.id,
                "user_id": logged_in_user.id
            })

            const community_channels = await model.v1.community.channels(fastify.mongo.db, {
                "community_id": community.id,
                "threshold": 0
            })

            community.online_members = await fastify.online_members(community, logged_in_user)
            fastify.websocket_broadcast("online_members_changed", {})

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/community/channels`, {
                csrf_token, community, logged_in_user, joined_channels, community_channels, device,
                "platform": fastify.platform(req),
                "request_query": req.query
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/:community_name/members", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)

            const { community_name } = req.params
            const community = await model.v1.community.show(fastify.mongo.db, {
                "name": community_name,
                "requested_by": logged_in_user.id
            })
            if (community === null) {
                return fastify.error(app, req, res, 404)
            }

            const all_users = await model.v1.community.members(fastify.mongo.db, {
                "community_id": community.id
            })
            const admin_users = []
            const moderator_users = []
            const menber_users = []
            const guest_users = []
            all_users.forEach(user => {
                if (user.role === constants.role.admin) {
                    return admin_users.push(user)
                }
                if (user.role === constants.role.moderator) {
                    return moderator_users.push(user)
                }
                if (user.role === constants.role.member) {
                    return menber_users.push(user)
                }
                if (user.role === constants.role.guest) {
                    return guest_users.push(user)
                }
            })

            community.online_members = await fastify.online_members(community, logged_in_user)
            fastify.websocket_broadcast("online_members_changed", {})

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/community/members`, {
                csrf_token, community, logged_in_user, device,
                admin_users, moderator_users, menber_users, guest_users,
                "platform": fastify.platform(req), "request_query": req.query
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    // チャンネル
    fastify.next("/:community_name/:channel_name", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)

            if (logged_in_user === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const { community_name } = req.params
            const community = await model.v1.community.show(fastify.mongo.db, {
                "name": community_name,
                "requested_by": logged_in_user.id
            })
            if (community === null) {
                return fastify.error(app, req, res, 404)
            }

            const { channel_name } = req.params
            const channel = await model.v1.channel.show(fastify.mongo.db, {
                "community_id": community.id, "name": channel_name
            })
            if (channel === null) {
                return res.redirect(`/${community.name}/channels`)
            }

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in_user.id,
                "key": "desktop_settings"
            })
            const { originalUrl } = req.raw
            const initial_column = {
                "param_ids": {
                    "channel_id": channel.id,
                },
                "type": "channel"
            }
            const stored_columns = (desktop_settings && desktop_settings.multiple_columns_enabled) ? await fastify.restore_columns(logged_in_user.id, originalUrl) : []
            const columns = await fastify.build_columns(stored_columns, initial_column, logged_in_user, req.query)


            const { has_newer_statuses, has_older_statuses, needs_redirect } = await fastify.generate_pagination_flags(
                memcached.v1.statuses.channel.count, {
                    "channel_id": channel.id,
                }, req.query)

            if (needs_redirect) {
                return res.redirect(`/${community.name}/${encodeURI(channel.name)}`)
            }

            const joined_channels = await collection.v1.channels.joined(fastify.mongo.db, {
                "community_id": community.id,
                "user_id": logged_in_user.id
            })

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const muted_words = await model.v1.mute.words.list(fastify.mongo.db, { "user_id": logged_in_user.id })

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in_user.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "community_id": community.id })

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)
            const custom_emoji_version = await memcached.v1.emoji.version(fastify.mongo.db, { "community_id": community.id })

            community.online_members = await fastify.online_members(community, logged_in_user)
            fastify.websocket_broadcast("online_members_changed", {})

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/community/channel`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, community, channel, logged_in_user, joined_channels, device, desktop_settings,
                columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                custom_emoji_version, muted_users, muted_words, has_newer_statuses, has_older_statuses
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next(`/:community_name/statuses`, async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)

            if (logged_in_user === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            const { community_name } = req.params
            const community = await model.v1.community.show(fastify.mongo.db, {
                "name": community_name,
                "requested_by": logged_in_user.id
            })
            if (community === null) {
                return fastify.error(app, req, res, 404)
            }

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in_user.id,
                "key": "desktop_settings"
            })

            const { originalUrl } = req.raw
            const initial_column = {
                "param_ids": {
                    "community_id": community.id
                },
                "type": "community"
            }
            const stored_columns = (desktop_settings && desktop_settings.multiple_columns_enabled) ? await fastify.restore_columns(logged_in_user.id, originalUrl) : []
            const columns = await fastify.build_columns(stored_columns, initial_column, logged_in_user, req.query)

            const joined_channels = await collection.v1.channels.joined(fastify.mongo.db, {
                "community_id": community.id,
                "user_id": logged_in_user.id
            })

            const { has_newer_statuses, has_older_statuses, needs_redirect } = await fastify.generate_pagination_flags(
                memcached.v1.statuses.community.count, {
                    "community_id": community.id,
                }, req.query)

            if (needs_redirect) {
                return res.redirect(`/${community.name}/statuses`)
            }

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const muted_words = await model.v1.mute.words.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            community.online_members = await fastify.online_members(community, logged_in_user)

            // オンラインを更新
            fastify.websocket_broadcast("online_members_changed", {})

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in_user.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "community_id": community.id })

            const custom_emoji_shortnames = []
            custom_emoji_list.forEach(emoji => {
                custom_emoji_shortnames.push(emoji.shortname)
            })
            custom_emoji_shortnames.sort(compare_shortname)
            const custom_emoji_version = await memcached.v1.emoji.version(fastify.mongo.db, { "community_id": community.id })

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/community/statuses`, {
                "platform": fastify.platform(req),
                "request_query": req.query,
                csrf_token, community, logged_in_user, joined_channels, device, desktop_settings,
                columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                muted_users, muted_words, has_newer_statuses, has_older_statuses, custom_emoji_version
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/:community_name/settings/profile", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in_user = await fastify.logged_in_user(req, res, session)
        if (logged_in_user === null) {
            return fastify.error(app, req, res, 404)
        }

        const { community_name } = req.params
        const community = await model.v1.community.show(fastify.mongo.db, { "name": community_name })
        if (community === null) {
            return fastify.error(app, req, res, 404)
        }

        const role = await memcached.v1.user.role.get(fastify.mongo.db, {
            "user_id": logged_in_user.id,
            "community_id": community.id
        })
        if (role !== constants.role.admin && role !== constants.role.moderator) {
            return fastify.error(app, req, res, 404)
        }

        const profile_image_size = config.community.profile.image_size
        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/community/settings/profile`, {
            csrf_token, profile_image_size, logged_in_user, device, community,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/:community_name/settings/role", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in_user = await fastify.logged_in_user(req, res, session)
        if (logged_in_user === null) {
            return fastify.error(app, req, res, 404)
        }

        const { community_name } = req.params
        const community = await model.v1.community.show(fastify.mongo.db, { "name": community_name })
        if (community === null) {
            return fastify.error(app, req, res, 404)
        }

        const role = await memcached.v1.user.role.get(fastify.mongo.db, {
            "user_id": logged_in_user.id,
            "community_id": community.id
        })
        if (role !== constants.role.admin && role !== constants.role.moderator) {
            return fastify.error(app, req, res, 404)
        }

        const members = await model.v1.community.members(fastify.mongo.db, { "community_id": community.id })

        const profile_image_size = config.community.profile.image_size
        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/community/settings/role`, {
            csrf_token, profile_image_size, logged_in_user, device, community, members, map_role_number,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/:community_name/settings/permissions", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)
            if (logged_in_user === null) {
                return fastify.error(app, req, res, 404)
            }

            const { community_name } = req.params
            const community = await model.v1.community.show(fastify.mongo.db, { "name": community_name })
            if (community === null) {
                return fastify.error(app, req, res, 404)
            }

            const role = await memcached.v1.user.role.get(fastify.mongo.db, {
                "user_id": logged_in_user.id,
                "community_id": community.id
            })
            if (role !== constants.role.admin) {
                return fastify.error(app, req, res, 404)
            }

            const permissions = await memcached.v1.community.permissions.get(fastify.mongo.db, {
                "community_id": community.id
            })

            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/community/settings/permissions`, {
                csrf_token, community, logged_in_user, map_role_number, permissions,
                "platform": fastify.platform(req),
            })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/:community_name/create_new_channel", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in_user = await fastify.logged_in_user(req, res, session)
        if (logged_in_user === null) {
            return fastify.error(app, req, res, 404)
        }

        const { community_name } = req.params
        const community = await memcached.v1.community.show(fastify.mongo.db, { "name": community_name })
        if (community === null) {
            return fastify.error(app, req, res, 404)
        }
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/channel/create`, {
            csrf_token, community, logged_in_user
        })
    })
    fastify.next("/:community_name/customize/emoji", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in_user = await fastify.logged_in_user(req, res, session)
        if (logged_in_user === null) {
            return fastify.error(app, req, res, 404)
        }

        const { community_name } = req.params
        const community = await model.v1.community.show(fastify.mongo.db, { "name": community_name })
        if (community === null) {
            return fastify.error(app, req, res, 404)
        }

        const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "community_id": community.id })
        const custom_emoji_version = await memcached.v1.emoji.version(fastify.mongo.db, { "community_id": community.id })

        for (let j = 0; j < custom_emoji_list.length; j++) {
            const emoji = custom_emoji_list[j]
            const user = await memcached.v1.user.show(fastify.mongo.db, { "id": emoji.added_by })
            assert(is_object(user), "$user must be of type object")
            emoji.user = user
        }

        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/community/customize/emoji`, {
            csrf_token, logged_in_user, device, community, custom_emoji_list, custom_emoji_version,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/:community_name", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)

            const { community_name } = req.params
            const community = await model.v1.community.show(fastify.mongo.db, { "name": community_name })
            if (community === null) {
                return fastify.error(app, req, res, 404)
            }

            community.online_members = await fastify.online_members(community, logged_in_user)
            fastify.websocket_broadcast("online_members_changed", {})

            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/community/about`, {
                csrf_token, community, logged_in_user, device,
                "platform": fastify.platform(req),
                "request_query": req.query
            })
        } catch (error) {
            return fastify.error(app, req, res, 500)
        }
    })
    next()
}