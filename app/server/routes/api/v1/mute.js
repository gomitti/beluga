import memcached from "../../../memcached"
import model from "../../../model"
import collection from "../../../collection"
import storage from "../../../config/storage"

module.exports = (fastify, options, next) => {
    let api_version = "v1"
    fastify.post(`/api/v1/mute/word/create`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            await model.v1.mute.user.create(fastify.mongo.db, {
                "requested_by": session.user_id,
                "target_user_id": user.id
            })
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/mute/user/create`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const user = await memcached.v1.user.show(fastify.mongo.db, {
                "id": req.body.user_id_to_mute, "name": req.body.user_name_to_mute
            })
            if (user === null) {
                throw new Error("対象のユーザーが見つかりません")
            }
            await model.v1.mute.user.create(fastify.mongo.db, {
                "requested_by": session.user_id,
                "user_id_to_mute": user.id
            })
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/mute/user/destory`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const user = await memcached.v1.user.show(fastify.mongo.db, {
                "id": req.body.user_id_to_mute, "name": req.body.user_name_to_mute
            })
            if (user === null) {
                throw new Error("対象のユーザーが見つかりません")
            }
            await model.v1.mute.user.destory(fastify.mongo.db, {
                "requested_by": session.user_id,
                "user_id_to_unmute": user.id
            })
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get(`/api/v1/mute/users/list`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const users = await model.v1.mute.users.list(fastify.mongo.db, {
                "user_id": session.user_id
            })
            res.send({ "success": true, users })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}