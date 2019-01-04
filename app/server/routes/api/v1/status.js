import api from "../../../api"
import model from "../../../model"
import memcached from "../../../memcached"
import collection from "../../../collection"
import storage from "../../../config/storage"
import { is_string } from "../../../assert"
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
        if (params.trim_server) {
            params.trim_server = parse_bool_str(params.trim_server)
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
    fastify.post(`/api/v1/status/update`, async (req, res) => {
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

            const { status_id, mentions } = await model.v1.status.update(fastify.mongo.db, params)
            const status = await collection.v1.status.show(fastify.mongo.db, {
                "id": status_id,
                "trim_user": false,
                "trim_recipient": false,
                "trim_server": false,
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
    fastify.post(`/api/v1/status/destroy`, async (req, res) => {
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
    fastify.get(`/api/v1/status/show`, async (req, res) => {
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