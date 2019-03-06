import api from "../../../api"
import model from "../../../model"
import memcached from "../../../memcached"
import collection from "../../../collection"
import storage from "../../../config/storage"
import assert, { is_string } from "../../../assert"
import { parse_bool_str } from "../../../lib/bool"
import assign from "../../../lib/assign";

module.exports = (fastify, options, next) => {
    const parse_params = params => {
        if (params.trim_user) {
            params.trim_user = parse_bool_str(params.trim_user)
        }
        if (params.trim_channel) {
            params.trim_channel = parse_bool_str(params.trim_channel)
        }
        if (params.trim_community) {
            params.trim_community = parse_bool_str(params.trim_community)
        }
        if (params.trim_recipient) {
            params.trim_recipient = parse_bool_str(params.trim_recipient)
        }
        if (params.trim_recipient) {
            params.trim_recipient = parse_bool_str(params.trim_recipient)
        }
        if (params.trim_favorited_by) {
            params.trim_favorited_by = parse_bool_str(params.trim_favorited_by)
        }
        if (params.trim_commenters) {
            params.trim_commenters = parse_bool_str(params.trim_commenters)
        }
        return params
    }
    const get_community_id = async (db, params) => {
        const { community_id, channel_id, in_reply_to_status_id, recipient_id } = params
        if (recipient_id) {
            return null
        }
        if (community_id) {
            return community_id
        }
        if (channel_id) {
            const channel = await memcached.v1.channel.show(db, { "id": channel_id })
            assert(channel !== null, "チャンネルが見つかりません")
            return channel.community_id
        }
        if (in_reply_to_status_id) {
            const in_reply_to_status = await memcached.v1.status.show(db, { "id": in_reply_to_status_id })
            assert(in_reply_to_status !== null, "コメント先の投稿が見つかりません")
            const { community_id } = in_reply_to_status
            if (!!community_id === false) {
                return null
            }
            return community_id
        }
        throw new Error("サーバーで問題が発生しました")
    }
    const join_community_if_needed = async (db, user_id, community_id) => {
        const already_in_community = await memcached.v1.community.joined(fastify.mongo.db, {
            user_id, community_id
        })
        if (already_in_community === false) {
            try {
                await model.v1.community.join(fastify.mongo.db, {
                    user_id, community_id
                })
            } catch (error) {
                throw new Error("問題が発生したためリクエストを続行できません")
            }
        }
    }
    const update = async (db, params) => {
        const { channel_id, in_reply_to_status_id, recipient_id } = params
        if (channel_id) {
            return await model.v1.status.update_channel(fastify.mongo.db, params)
        }
        if (in_reply_to_status_id) {
            return await model.v1.status.update_thread(fastify.mongo.db, params)
        }
        if (recipient_id) {
            return await model.v1.status.update_message(fastify.mongo.db, params)
        }
        throw new Error("投稿先を指定してください")
    }
    fastify.post("/api/v1/status/update", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const ip_address = req.headers["x-real-ip"]

            const ua = req.headers["user-agent"];
            const from_mobile = is_string(ua) ? (ua.match(/mobile/i) ? true : false) : false

            const params = Object.assign({ "user_id": session.user_id, ip_address, from_mobile }, req.body)
            if (params.do_not_notify) {
                params.do_not_notify = parse_bool_str(params.do_not_notify)
            }

            // コミュニティに参加していない場合は自動的に参加させる
            const community_id = await get_community_id(fastify.mongo.db, params)
            if (community_id) {
                await join_community_if_needed(fastify.mongo.db, session.user_id, community_id)
            }

            const { status_id, mentions } = await update(fastify.mongo.db, params)
            const status = await collection.v1.status.show(fastify.mongo.db, {
                "id": status_id,
                "trim_user": false,
                "trim_recipient": false,
                "trim_community": false,
                "trim_channel": false
            })
            mentions.forEach(user => {
                fastify.websocket_broadcast("mention_received", { "recipient": user, status })
            })
            if (status.in_reply_to_status_id) {
                const in_reply_to_status = await collection.v1.status.show(fastify.mongo.db, {
                    "id": status.in_reply_to_status_id,
                    "trim_commenters": false
                })
                if (in_reply_to_status) {
                    fastify.websocket_broadcast("status_comments_updated", {
                        "comments_count": in_reply_to_status.comments_count,
                        "commenters": in_reply_to_status.commenters,
                        "last_comment": status,
                        "id": in_reply_to_status.id
                    })
                }
            }
            fastify.websocket_broadcast("status_updated", { status })
            res.send({ "success": true, status })
        } catch (error) {
            console.log(error.stack)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/status/destroy", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = Object.assign({ "user_id": session.user_id }, req.body)

            const status = await memcached.v1.status.show(fastify.mongo.db, { "id": params.id })
            if (status === null) {
                throw new Error("投稿が見つかりません")
            }

            await model.v1.status.destroy(fastify.mongo.db, params)
            fastify.websocket_broadcast("status_deleted", { "id": params.id })

            if (status.in_reply_to_status_id) {
                const in_reply_to_status = await collection.v1.status.show(fastify.mongo.db, {
                    "id": status.in_reply_to_status_id,
                    "trim_commenters": false
                })
                if (in_reply_to_status) {
                    fastify.websocket_broadcast("status_comments_updated", {
                        "comments_count": in_reply_to_status.comments_count,
                        "commenters": in_reply_to_status.commenters,
                        "id": in_reply_to_status.id
                    })
                }
            }

            res.send({ "success": true, "id": params.id })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get("/api/v1/status/show", async (req, res) => {
        try {
            const params = parse_params(assign(req.query))
            const session = await fastify.authenticate(req, res)
            if (session.user_id) {
                params.requested_by = session.user_id
            }
            const status = await collection.v1.status.show(fastify.mongo.db, params)
            res.send({ "success": true, status })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}