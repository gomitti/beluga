import model from "../../../model"
import memcached from "../../../memcached"
import storage from "../../../config/storage"

module.exports = (fastify, options, next) => {
    // オンラインのユーザーを取得
    fastify.decorate("online_members", async (server, logged_in) => {
        const online_user_ids = fastify.websocket_bridge.get_users_by_server(server)
        const member = []
        let including_me = false
        for (let j = 0; j < online_user_ids.length; j++) {
            const user_id = online_user_ids[j]
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
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = Object.assign({ "user_id": session.user_id }, req.body)
            const server = await model.v1.server.create(fastify.mongo.db, params)
            await model.v1.server.join(fastify.mongo.db, { "server_id": server.id, "user_id": session.user_id })
            res.send({ "success": true, server })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/server/join`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            await model.v1.server.join(fastify.mongo.db, {
                "server_id": req.body.server_id,
                "user_id": session.user_id
            })
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get(`/api/v1/server/members`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const server = await memcached.v1.server.show(fastify.mongo.db, { "id": req.query.id, "name": req.query.name })
            if (server === null) {
                throw new Error("サーバーが見つかりません")
            }
            const members = await model.v1.server.members(fastify.mongo.db, { "id": server.id })
            res.send({ "success": true, members })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get(`/api/v1/server/online_members`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const server = await memcached.v1.server.show(fastify.mongo.db, { "name": req.query.name })
            if (server === null) {
                throw new Error("サーバーが見つかりません")
            }
            const members = await fastify.online_members(server, null)
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

            const user = await memcached.v1.user.show(fastify.mongo.db, { "id": user_id })
            if (user === null) {
                throw new Error("ユーザーが見つかりません")
            }

            const server = await memcached.v1.server.show(fastify.mongo.db, { "id": req.body.server_id })
            if (server === null) {
                throw new Error("サーバーが見つかりません")
            }

            const remote = storage.servers[0]
            const url = await model.v1.server.avatar.reset(fastify.mongo.db, {
                "server_id": server.id,
                "user_id": user.id,
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

            const user = await memcached.v1.user.show(fastify.mongo.db, { "id": user_id })
            if (user === null) {
                throw new Error("ユーザーが見つかりません")
            }

            if (!!req.body.data === false || typeof req.body.data !== "string") {
                throw new Error("画像がありません")
            }

            const server = await memcached.v1.server.show(fastify.mongo.db, { "id": req.body.server_id })
            if (server === null) {
                throw new Error("サーバーが見つかりません")
            }

            const base64_components = req.body.data.split(",")
            const base64_data = base64_components.length == 2 ? base64_components[1] : req.body.data
            const data = new Buffer(base64_data, "base64");

            const remote = storage.servers[0]
            const url = await model.v1.server.avatar.update(fastify.mongo.db, {
                data,
                "server_id": server.id,
                "user_id": user.id,
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

            const user = await memcached.v1.user.show(fastify.mongo.db, { "id": user_id })
            if (user === null) {
                throw new Error("ユーザーが見つかりません")
            }

            const server = await memcached.v1.server.show(fastify.mongo.db, { "id": req.body.server_id })
            if (server === null) {
                throw new Error("サーバーが見つかりません")
            }

            await model.v1.server.profile.update(fastify.mongo.db, Object.assign({}, req.body, {
                "server_id": server.id,
                "user_id": user.id
            }))

            const updated_server = await model.v1.server.show(fastify.mongo.db, { "id": server.id })
            res.send({ "success": true, "server": updated_server })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get(`/api/v1/server/events`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            await model.v1.server.join(fastify.mongo.db, { "server_id": server.id, "user_id": session.user_id })
            res.send({ "success": true, server })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}