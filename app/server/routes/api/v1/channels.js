import api from "../../../api"
import collection from "../../../collection"
import assign from "../../../lib/assign";

module.exports = (fastify, options, next) => {
    fastify.post("/api/v1/channels/joined", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = assign(req.body, { "user_id": session.user_id })
            const channels = await collection.v1.channels.joined(fastify.mongo.db, params)
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}