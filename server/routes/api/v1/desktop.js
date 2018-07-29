import model from "../../../model"
import assign from "../../../lib/assign";

module.exports = (fastify, options, next) => {
    fastify.post(`/api/v1/desktop/columns/store`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            await model.v1.desktop.columns.store(fastify.mongo.db, params)
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/desktop/columns/restore`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            const columns = await model.v1.desktop.columns.restore(fastify.mongo.db, params)
            res.send({ "success": true, "columns": columns })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}