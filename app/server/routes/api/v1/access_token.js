import api from "../../../api"
import model from "../../../model"
import storage from "../../../config/storage"
import assert from "../../../assert"

module.exports = (fastify, options, next) => {
    fastify.post("/api/v1/access_token/generate", async (req, res) => {
        try {
            const session = await fastify.authenticate_cookie(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = { "user_id": session.user_id }
            const { token, secret } = await model.v1.access_token.generate(fastify.mongo.db, params)
            res.send({ "success": true, token, secret })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}