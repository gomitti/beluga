import api from "../../../api"
import model from "../../../model"
import assign from "../../../lib/assign";

module.exports = (fastify, options, next) => {
    fastify.post(`/api/v1/hashtag/create`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            const hashtag = await model.v1.hashtag.create(fastify.mongo.db, params)
            res.send({ "success": true, hashtag })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/hashtag/update`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            const hashtag = await model.v1.hashtag.update(fastify.mongo.db, params)
            res.send({ "success": true, hashtag })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get(`/api/v1/hashtag/show`, async (req, res) => {
        try {
            const params = assign(req.query)
            const session = await fastify.authenticate(req, res)
            if (session.user_id) {
                params.requested_by = session.user_id
            }
            const hashtag = await model.v1.hashtag.show(fastify.mongo.db, params)
            res.send({ "success": true, hashtag })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/hashtag/join`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            await model.v1.hashtag.join(fastify.mongo.db, params)
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}