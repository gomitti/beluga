import api from "../../../api"
import model from "../../../model"
import collection from "../../../collection"
import storage from "../../../config/storage"
import { is_string } from "../../../assert"
import { parse_bool_str } from "../../../lib/bool"

module.exports = (fastify, options, next) => {
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
                "trim_hashtag": false
            })
            for (const user of mentions) {
                fastify.websocket_broadcast("mention_received", { "recipient": user, status })
            }
            fastify.websocket_broadcast("status_updated", { status })
            res.send({ "success": true, status })
        } catch (error) {
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
            await model.v1.status.destroy(fastify.mongo.db, params)
            fastify.websocket_broadcast("status_deleted", { "id": params.id })
            res.send({ "success": true, "id": params.id })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}