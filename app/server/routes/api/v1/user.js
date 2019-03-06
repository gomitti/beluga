import api from "../../../api"
import model from "../../../model"

module.exports = (fastify, options, next) => {
    fastify.get("/api/v1/user/show", async (req, res) => {
        try {
            const user = await model.v1.user.show(fastify.mongo.db, req.query)
            res.send({ "success": true, user })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}