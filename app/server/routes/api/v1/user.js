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
    fastify.post("/api/v1/user/role/update", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const { community_id, role, user_id } = req.body
            await model.v1.user.role.update(fastify.mongo.db,
                {
                    "community_id": community_id,
                    "user_id_to_update": user_id,
                    "requested_by": session.user_id,
                    "role": role
                }
            )
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}