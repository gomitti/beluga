import config from "../../config/beluga"
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

module.exports = (fastify, options, next) => {
    fastify.next("/thread/:in_reply_to_status_id", async (app, req, res) => {
        try {
            const session = await fastify.session.start(req, res)
            const csrf_token = await fastify.csrf_token(req, res, session)
            const logged_in_user = await fastify.logged_in_user(req, res, session)

            if (logged_in_user === null) {
                return res.redirect(`/login?redirect=${req.raw.originalUrl}`)
            }

            // const community = await model.v1.community.show(fastify.mongo.db, {
            //     "name": community_name,
            //     "requested_by": logged_in_user.id
            // })
            // if (community === null) {
            //     return fastify.error(app, req, res, 404)
            // }

            const in_reply_to_status_id = req.params.in_reply_to_status_id
            const in_reply_to_status = await collection.v1.status.show(fastify.mongo.db, {
                "id": in_reply_to_status_id,
                "trim_user": false,
                "trim_community": false,
                "trim_channel": false,
                "trim_recipient": false,
                "trim_favorited_by": false,
                "trim_commenters": false,
                "requested_by": logged_in_user.id
            })
            if (in_reply_to_status === null) {
                return fastify.error(app, req, res, 404)
            }

            const desktop_settings = await memcached.v1.kvs.restore(fastify.mongo.db, {
                "user_id": logged_in_user.id,
                "key": "desktop_settings"
            })

            const muted_users = await model.v1.mute.users.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const muted_words = await model.v1.mute.words.list(fastify.mongo.db, { "user_id": logged_in_user.id })

            const pinned_media = await collection.v1.account.pin.media.list(fastify.mongo.db, { "user_id": logged_in_user.id })
            const recent_uploads = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in_user.id, "count": 100 })
            const pinned_emoji_shortnames = await model.v1.account.pin.emoji.list(fastify.mongo.db, { "user_id": logged_in_user.id })


            const { community } = in_reply_to_status
            if (community) {
                const { originalUrl } = req.raw
                const initial_column = {
                    "param_ids": {
                        "in_reply_to_status_id": in_reply_to_status.id,
                    },
                    "type": "thread"
                }
                const stored_columns = (desktop_settings && desktop_settings.multiple_columns_enabled) ? await fastify.restore_columns(logged_in_user.id, originalUrl) : []
                const columns = await fastify.build_columns(stored_columns, initial_column, logged_in_user, req.query)

                const { has_newer_statuses, has_older_statuses, needs_redirect } = await fastify.generate_pagination_flags(
                    memcached.v1.statuses.thread.count, {
                        "in_reply_to_status_id": in_reply_to_status.id,
                    }, req.query)

                if (needs_redirect) {
                    return res.redirect(`/thread/${in_reply_to_status.id}`)
                }

                const joined_channels = await collection.v1.channels.joined(fastify.mongo.db, {
                    "community_id": community.id,
                    "user_id": logged_in_user.id
                })
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
                app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/community/thread`, {
                    "platform": fastify.platform(req),
                    "request_query": req.query,
                    csrf_token, community, in_reply_to_status, logged_in_user, joined_channels, device, desktop_settings,
                    columns, pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                    muted_users, muted_words, has_newer_statuses, has_older_statuses, custom_emoji_version
                })
            } else {
                const statuses = await timeline.v1.thread(fastify.mongo.db, assign(req.query, {
                    "trim_user": false,
                    "trim_community": false,
                    "trim_channel": false,
                    "trim_recipient": false,
                    "trim_favorited_by": false,
                    "trim_commenters": false,
                    "trim_reaction_users": false,
                    "in_reply_to_status_id": in_reply_to_status.id,
                }))

                const { has_newer_statuses, has_older_statuses, needs_redirect } = await fastify.generate_pagination_flags(
                    memcached.v1.statuses.thread.count, {
                        "in_reply_to_status_id": in_reply_to_status.id
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
                app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/status/thread`, {
                    "platform": fastify.platform(req),
                    "request_query": req.query,
                    csrf_token, community, in_reply_to_status, logged_in_user, device, desktop_settings,
                    pinned_media, recent_uploads, pinned_emoji_shortnames, custom_emoji_shortnames,
                    muted_users, muted_words, statuses, has_newer_statuses, has_older_statuses, custom_emoji_version
                })
            }

        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    next()
}