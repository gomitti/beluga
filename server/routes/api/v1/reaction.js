import model from "../../../model"

module.exports = (fastify, options, next) => {
    fastify.post(`/api/v1/reaction/add`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (!!session.user_id === false) {
                throw new Error("ログインしてください")
            }
            const params = Object.assign({}, req.body, { "user_id": session.user_id })
            await model.v1.reaction.add(fastify.mongo.db, params)
            const status = await model.v1.status.show(fastify.mongo.db, { "id": params.status_id })
            fastify.websocket_broadcast("reaction_added", { status })
            res.send({ "success": true, status })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/reaction/toggle`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (!!session.user_id === false) {
                throw new Error("ログインしてください")
            }
            const params = Object.assign({}, req.body, { "user_id": session.user_id })
            await model.v1.reaction.toggle(fastify.mongo.db, params)
            const status = await model.v1.status.show(fastify.mongo.db, { "id": params.status_id, "trim_favorited_by": false })
            fastify.websocket_broadcast("reaction_added", { status })
            res.send({ "success": true, status })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}