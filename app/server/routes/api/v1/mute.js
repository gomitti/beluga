import memcached from "../../../memcached"
import model from "../../../model"
import collection from "../../../collection"
import storage from "../../../config/storage"
import { is_string } from "../../../assert"

module.exports = (fastify, options, next) => {
    fastify.post("/api/v1/mute/words/update", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const { words } = req.body
            if (is_string(words) === false) {
                throw new Error("ミュートする単語を指定してください")
            }
            await model.v1.mute.words.update(fastify.mongo.db, {
                "user_id": session.user_id,
                "word_array": words.split(",")
            })
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/mute/user/create", async (req, res) => {
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
    fastify.post("/api/v1/mute/user/destory", async (req, res) => {
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
    fastify.get("/api/v1/mute/users/list", async (req, res) => {
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