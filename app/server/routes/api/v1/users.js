import api from "../../../api"
import memcached from "../../../memcached"

module.exports = (fastify, options, next) => {
    let api_version = "v1"
    fastify.get(`/api/v1/users/list`, async (req, res) => {
        try {
            const users = await memcached.v1.users.list(fastify.mongo.db, req.query)
            res.send({ "success": true, users })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}