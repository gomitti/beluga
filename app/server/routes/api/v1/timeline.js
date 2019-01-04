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
        if (params.trim_server) {
            params.trim_server = parse_bool_str(params.trim_server)
        }
        if (params.trim_recipient) {
            params.trim_recipient = parse_bool_str(params.trim_recipient)
        }
        if (params.count) {
            params.count = parseInt(params.count)
        }
        return params
    }
    fastify.get(`/api/v1/timeline/channel`, async (req, res) => {
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
    fastify.get(`/api/v1/timeline/thread`, async (req, res) => {
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
    fastify.get(`/api/v1/timeline/home`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const params = parse_params(assign({
                "user_id": session.user_id
            }, req.query))
            const statuses = await timeline.v1.home(fastify.mongo.db, params)
            res.send({ "success": true, statuses })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get(`/api/v1/timeline/server`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const params = parse_params(assign({
                "user_id": session.user_id
            }, req.query))
            const statuses = await timeline.v1.server(fastify.mongo.db, params)
            res.send({ "success": true, statuses })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get(`/api/v1/timeline/notifications`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const params = parse_params(assign({
                "user_id": session.user_id
            }, req.query))
            const statuses = await timeline.v1.mentions(fastify.mongo.db, params)
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