import model from "../../../model"
import memcached from "../../../memcached"
import config from "../../../config/beluga"
import assign from "../../../lib/assign";
import assert, { is_object } from "../../../assert"

module.exports = (fastify, options, next) => {
    fastify.register(require("fastify-multipart"), {
        "limits": {
            "fileSize": config.emoji.max_filesize,
        }
    })
    fastify.get("/api/v1/emoji/list", async (req, res) => {
        try {
            const { community_id } = req.query
            const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { community_id })
            for (let j = 0; j < custom_emoji_list.length; j++) {
                const emoji = custom_emoji_list[j]
                const user = await memcached.v1.user.show(fastify.mongo.db, { "id": emoji.added_by })
                assert(is_object(user), "$user must be of type object")
                emoji.user = user
            }
            res.send({ "success": true, "custom_emoji_list": custom_emoji_list })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/emoji/remove", async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (session.user_id === null) {
                throw new Error("ログインしてください")
            }
            const params = Object.assign({}, req.body, { "user_id": session.user_id })
            const removed_emoji = await model.v1.emoji.remove(fastify.mongo.db, params)
            const { shortname } = removed_emoji
            fastify.websocket_broadcast("emoji_removed", { shortname })
            res.send({ "success": true })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post("/api/v1/emoji/add", async (req, res) => {
        try {
            let buffer = null
            const fields = {}
            const mp = req.multipart((field, file, filename, encoding, mimetype) => {
                const data = []
                file.on("data", chunk => {
                    data.push(chunk)
                })
                file.on("end", () => {
                    buffer = Buffer.concat(data)
                })
            }, error => {
                if (error) {
                    throw new Error("サーバーで問題が発生しました")
                }
            })

            mp.on("field", (key, value) => {
                fields[key] = value
            })
            mp.on("finish", async () => {
                try {
                    const { shortname } = fields
                    if (!!shortname === false) {
                        throw new Error("タグ名を指定してください")
                    }

                    const { community_id } = fields
                    if (!!community_id === false) {
                        throw new Error("コミュニティを指定してください")
                    }

                    const { access_token, access_token_secret, csrf_token } = fields
                    req.body = { access_token, access_token_secret }

                    const session = await fastify.authenticate(req, res, csrf_token)
                    if (session.user_id === null) {
                        throw new Error("ログインしてください")
                    }

                    if (buffer === null) {
                        throw new Error("画像を指定してください")
                    }
                    await model.v1.emoji.add(fastify.mongo.db, {
                        "data": buffer,
                        "user_id": session.user_id,
                        "community_id": community_id,
                        "shortname": shortname
                    })
                    fastify.websocket_broadcast("emoji_added", { shortname })
                    memcached.v1.emoji.list.flush(community_id)
                    res.send({ "success": true })
                } catch (error) {
                    res.send({ "success": false, "error": error.toString() })
                }
            })
        } catch (error) {
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}