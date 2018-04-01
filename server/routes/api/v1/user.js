import api from "../../../api"
import model from "../../../model"
import collection from "../../../collection"
import storage from "../../../config/storage"

module.exports = (fastify, options, next) => {
    let api_version = "v1"
    fastify.post(`/api/v1/user/show`, async (req, res) => {
        try {
            const params = req.body
            const user = await model.v1.user.show(fastify.mongo.db, params)
            res.send({ "success": true, user })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}