import model from "../../../model"
import memcached from "../../../memcached"
import api from "../../../api"
import storage from "../../../config/storage"
import constants from "../../../constants"

module.exports = (fastify, options, next) => {
    // オンラインのユーザーを取得
    fastify.decorate("online_members", async (community, logged_in_user) => {
        const online_user_ids = fastify.websocket_bridge.get_users_by_community(community)
        const member = []
        let including_me = false
        for (let j = 0; j < online_user_ids.length; j++) {
            const user_id = online_user_ids[j]
            const user = await memcached.v1.user.show(fastify.mongo.db, { "id": user_id })
            if (user) {
                member.push(user)
                if (logged_in_user && user.id.equals(logged_in_user.id)) {
                    including_me = true
                }
            }
        }
        if (logged_in_user && including_me === false) {
            member.push(logged_in_user)
        }
        return member
    })
    fastify.post("/api/v1/community/create", async (req, res) => {
        // トランザクション
        const mongodb_session = fastify.mongo.client.startSession()
        mongodb_session.startTransaction()
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = Object.assign({ "user_id": session.user_id }, req.body)
            const community = await model.v1.community.create(fastify.mongo.db, params)

            await api.v1.user.role.update(fastify.mongo.db, {
                "user_id": session.user_id,
                "community_id": community.id,
                "role": constants.role.admin,
            })
            memcached.v1.user.role.get.flush(community.id, session.user_id)
            await model.v1.community.join(fastify.mongo.db,
                { "community_id": community.id, "user_id": session.user_id }
            )
            await mongodb_session.commitTransaction()
            mongodb_session.endSession()
            res.send({ "success": true, community })
        } catch (error) {
            console.log(error)
            await mongodb_session.abortTransaction()
            mongodb_session.endSession()
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/community/join", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            await model.v1.community.join(fastify.mongo.db, {
                "community_id": req.body.community_id,
                "user_id": session.user_id
            })
            res.send({ "success": true })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get("/api/v1/community/members", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const { community_id, community_name } = req.query
            const community = await memcached.v1.community.show(fastify.mongo.db, {
                "id": community_id, "name": community_name
            })
            if (community === null) {
                throw new Error("コミュニティが見つかりません")
            }
            const members = await model.v1.community.members(fastify.mongo.db, {
                "community_id": community.id
            })
            res.send({ "success": true, members })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get("/api/v1/community/channels", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const { community_id, community_name } = req.query
            const community = await memcached.v1.community.show(fastify.mongo.db, {
                "id": community_id, "name": community_name
            })
            if (community === null) {
                throw new Error("コミュニティが見つかりません")
            }
            const channels = await model.v1.community.channels(fastify.mongo.db, {
                "community_id": community.id
            })
            res.send({ "success": true, channels })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get("/api/v1/community/online_members", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const { community_id, community_name } = req.query
            const community = await memcached.v1.community.show(fastify.mongo.db, {
                "id": community_id, "name": community_name
            })
            if (community === null) {
                throw new Error("コミュニティが見つかりません")
            }
            const members = await fastify.online_members(community, null)
            res.send({ "success": true, members })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/community/avatar/reset", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const remote = storage.servers[0]
            const url = await model.v1.community.avatar.reset(fastify.mongo.db, {
                "community_id": req.body.community_id,
                "user_id": session.user_id,
                "storage": remote
            })
            res.send({ "success": true, "avatar_url": url })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/community/avatar/update", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const { community_id, data } = req.body
            if (typeof data !== "string") {
                throw new Error("画像がありません")
            }

            const base64_components = data.split(",")
            const base64_data = base64_components.length == 2 ? base64_components[1] : data
            const buffer = new Buffer(base64_data, "base64");

            const remote = storage.servers[0]
            const url = await model.v1.community.avatar.update(fastify.mongo.db, {
                "data": buffer,
                "community_id": community_id,
                "user_id": session.user_id,
                "storage": remote
            })
            res.send({ "success": true, "avatar_url": url })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/community/profile/update", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const { community_id } = req.body
            await model.v1.community.profile.update(fastify.mongo.db, Object.assign({}, req.body, {
                "community_id": community_id,
                "user_id": session.user_id
            }))

            const updated_community = await model.v1.community.show(fastify.mongo.db, { "id": community_id })
            res.send({ "success": true, "community": updated_community })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.get("/api/v1/community/events", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            await model.v1.community.join(fastify.mongo.db, { "community_id": community.id, "user_id": session.user_id })
            res.send({ "success": true, community })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/community/permissions/update", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            const { user_id } = session
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const { allowed, community_id } = req.body
            if (typeof allowed !== "boolean") {
                throw new Error("allowedを指定してください")
            }
            await model.v1.community.permissions.update(fastify.mongo.db, Object.assign({}, req.body, {
                "community_id": community_id,
                "user_id": session.user_id,
                "allowed": allowed
            }))
            const permissions = await api.v1.community.permissions.get(fastify.mongo.db, {
                "community_id": community_id
            })
            res.send({ "success": true })
        } catch (error) {
            console.log(error)
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}