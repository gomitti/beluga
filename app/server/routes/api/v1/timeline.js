import timeline from "../../../timeline"
import { parse_bool_str } from "../../../lib/bool"
import logger from "../../../logger"
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
        if (params.count) {
            params.count = parseInt(params.count)
        }
        return params
    }
    fastify.get("/api/v1/timeline/channel", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const params = parse_params(assign({
                "user_id": session.user_id
            }, req.query))
            const statuses = await timeline.v1.channel(fastify.mongo.db, params)
            res.send({ "success": true, statuses })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get("/api/v1/timeline/thread", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const params = parse_params(assign({
                "user_id": session.user_id
            }, req.query))
            const statuses = await timeline.v1.thread(fastify.mongo.db, params)
            res.send({ "success": true, statuses })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get("/api/v1/timeline/message", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const params = parse_params(assign({
                "user_id": session.user_id
            }, req.query))
            const statuses = await timeline.v1.message(fastify.mongo.db, params)
            res.send({ "success": true, statuses })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get("/api/v1/timeline/community", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const params = parse_params(assign({
                "user_id": session.user_id
            }, req.query))
            const statuses = await timeline.v1.community(fastify.mongo.db, params)
            res.send({ "success": true, statuses })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get("/api/v1/timeline/notifications", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const params = parse_params(assign({
                "user_id": session.user_id
            }, req.query))
            const statuses = await timeline.v1.notifications(fastify.mongo.db, params)
            res.send({ "success": true, statuses })
        } catch (error) {
            logger.log({
                "level": "error",
                "stack": error.stack ? error.stack.split("\n") : null,
                "error": error,
            })
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}