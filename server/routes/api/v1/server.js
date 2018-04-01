import model from "../../../model"
import memcached from "../../../memcached"
import storage from "../../../config/storage"

module.exports = (fastify, options, next) => {
    // オンラインのユーザーを取得
    fastify.decorate("members", async (server, logged_in) => {
        const online_user_ids = fastify.online.users(server)
        const member = []
        let including_me = false
        for (const user_id of online_user_ids) {
            const user = await memcached.v1.user.show(fastify.mongo.db, { "id": user_id })
            if (user) {
                member.push(user)
                if (logged_in && user.id.equals(logged_in.id)) {
                    including_me = true
                }
            }
        }
        if (logged_in && including_me === false) {
            member.push(logged_in)
        }
        return member
    })
    fastify.post(`/api/v1/server/create`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (!!session.user_id === false) {
                throw new Error("ログインしてください")
            }
            const params = Object.assign({ "user_id": session.user_id }, req.body)
            const server = await model.v1.server.create(fastify.mongo.db, params)
            res.send({ "success": true, server })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/server/members`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (!!session.user_id === false) {
                throw new Error("ログインしてください")
            }
            const server = await memcached.v1.server.show(fastify.mongo.db, { "name": req.body.name })
            const members = await fastify.members(server, null)
            res.send({ "success": true, members })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/server/avatar/reset`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const { user_id } = session
            if (!!user_id === false) {
                throw new Error("ログインしてください")
            }

            const server = await memcached.v1.server.show(fastify.mongo.db, { "id": req.body.server_id })
            if (server === null) {
                throw new Error("サーバーが見つかりません")
            }

            if (user_id.equals(server.created_by) === false) {
                throw new Error("権限がありません")
            }

            const remote = storage.servers[0]
            const url = await model.v1.server.avatar.reset(fastify.mongo.db, {
                "server_id": server.id,
                "storage": remote
            })
            res.send({ "success": true, "avatar_url": url })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/server/avatar/update`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const { user_id } = session
            if (!!user_id === false) {
                throw new Error("ログインしてください")
            }

            if (!!req.body.data === false || typeof req.body.data !== "string") {
                throw new Error("画像がありません")
            }

            const server = await memcached.v1.server.show(fastify.mongo.db, { "id": req.body.server_id })
            if (server === null) {
                throw new Error("サーバーが見つかりません")
            }

            if (user_id.equals(server.created_by) === false) {
                throw new Error("権限がありません")
            }

            const base64_components = req.body.data.split(",")
            const base64_data = base64_components.length == 2 ? base64_components[1] : req.body.data
            const data = new Buffer(base64_data, "base64");

            const remote = storage.servers[0]
            const url = await model.v1.server.avatar.update(fastify.mongo.db, {
                data,
                "server_id": server.id,
                "storage": remote
            })
            res.send({ "success": true, "avatar_url": url })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/server/profile/update`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const { user_id } = session
            if (!!user_id === false) {
                throw new Error("ログインしてください")
            }

            const server = await memcached.v1.server.show(fastify.mongo.db, { "id": req.body.server_id })
            if (server === null) {
                throw new Error("サーバーが見つかりません")
            }

            if (user_id.equals(server.created_by) === false) {
                throw new Error("権限がありません")
            }

            await model.v1.server.profile.update(fastify.mongo.db, Object.assign({}, req.body, {
                "server_id": server.id,
            }))
            const updated_server = await model.v1.server.show(fastify.mongo.db, { "id": server.id })
            res.send({ "success": true, "server": updated_server })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}