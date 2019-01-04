import api from "../../../api"
import model from "../../../model"
import assign from "../../../lib/assign"
import { parse_bool_str } from "../../../lib/bool"

module.exports = (fastify, options, next) => {
    fastify.post(`/api/v1/channel/create`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            if (params.is_public) {
                params.is_public = parse_bool_str(params.is_public)
            }
            if (params.invitation_needed) {
                params.invitation_needed = parse_bool_str(params.invitation_needed)
            }
            const channel = await model.v1.channel.create(fastify.mongo.db, params)
            res.send({ "success": true, channel })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/channel/update`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            const channel = await model.v1.channel.update(fastify.mongo.db, params)
            res.send({ "success": true, channel })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get(`/api/v1/channel/show`, async (req, res) => {
        try {
            const params = assign(req.query)
            const session = await fastify.authenticate(req, res)
            if (session.user_id) {
                params.requested_by = session.user_id
            }
            const channel = await model.v1.channel.show(fastify.mongo.db, params)
            res.send({ "success": true, channel })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/channel/join`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            await model.v1.channel.join(fastify.mongo.db, params)
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/channel/attribute/update`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            if (params.is_public) {
                params.is_public = parse_bool_str(params.is_public)
            }
            if (params.invitation_needed) {
                params.invitation_needed = parse_bool_str(params.invitation_needed)
            }
            await model.v1.channel.attribute.update(fastify.mongo.db, params)
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}