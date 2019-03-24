import model from "../../../model"
import collection from "../../../collection"

module.exports = (fastify, options, next) => {
    fastify.post("/api/v1/reaction/add", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = Object.assign({}, req.body, { "user_id": session.user_id })
            const reaction = await model.v1.reaction.add(fastify.mongo.db, params)

            const { shortname } = params
            const status = await collection.v1.status.show(fastify.mongo.db, {
                "id": params.status_id,
                "trim_favorited_by": false,
                "trim_reaction_users": false,
            })
            fastify.websocket_broadcast("reaction_added", { status, shortname })
            res.send({ "success": true, status, reaction })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/reaction/toggle", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = Object.assign({}, req.body, { "user_id": session.user_id })
            const { removed, reaction } = await model.v1.reaction.toggle(fastify.mongo.db, params)

            const { shortname } = params
            const status = await collection.v1.status.show(fastify.mongo.db, {
                "id": params.status_id,
                "trim_favorited_by": false,
                "trim_reaction_users": false,
            })
            if (removed) {
                fastify.websocket_broadcast("reaction_removed", { status, shortname })
            } else {
                fastify.websocket_broadcast("reaction_added", { status, reaction })
            }
            res.send({ "success": true, status })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}