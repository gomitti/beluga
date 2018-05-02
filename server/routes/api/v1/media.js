import model from "../../../model"
import api from "../../../api"
import storage from "../../../config/storage"
import memcached from "../../../memcached"
import config from "../../../config/beluga"
import logger from "../../../logger"

module.exports = (fastify, options, next) => {
    fastify.register(require("fastify-multipart"), {
        "limits": {
            "fileSize": config.media.video.max_filesize + 1,    // 少し多めにしておくと容量チェックができる
        }
    })
    fastify.post(`/api/v1/media/destroy`, async (req, res) => {
        try {
            const session = await fastify.authenticate(req, res)
            if (!!session.user_id === false) {
                throw new Error("ログインしてください")
            }

            await model.v1.media.destroy(fastify.mongo.db, {
                "user_id": session.user_id,
                "id": req.body.id
            })
            res.send({ "success": true })
        } catch (error) {
            logger.log({
                "level": "error",
                "stack": error.stack ? error.stack.split("\n") : null,
                error,
            })
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/media/image/upload`, async (req, res) => {
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
                const { csrf_token } = fields
                if (!!csrf_token === false) {
                    throw new Error("ログインしてください")
                }

                const session = await fastify.authenticate(req, res, csrf_token)
                if (!!session.user_id === false) {
                    throw new Error("ログインしてください")
                }

                if (buffer === null) {
                    throw new Error("動画がありません")
                }

                const user = await model.v1.user.show(fastify.mongo.db, { "id": session.user_id })
                if (user === null) {
                    throw new Error("不正なユーザーです")
                }

                const remote = storage.servers[0]
                const urls = await api.v1.media.image.upload(fastify.mongo.db, {
                    "data": buffer,
                    "user_id": user.id,
                    "storage": remote
                })
                memcached.v1.delete_media_list_from_cache(user)
                res.send({ "success": true, urls })
            })
        } catch (error) {
            logger.log({
                "level": "error",
                "stack": error.stack ? error.stack.split("\n") : null,
                error,
            })
            res.send({ "success": false, "error": error.toString() })
        }
    })
    fastify.post(`/api/v1/media/video/upload`, async (req, res) => {
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
                const { csrf_token } = fields
                if (!!csrf_token === false) {
                    throw new Error("ログインしてください")
                }

                const session = await fastify.authenticate(req, res, csrf_token)
                if (!!session.user_id === false) {
                    throw new Error("ログインしてください")
                }

                if (buffer === null) {
                    throw new Error("動画がありません")
                }

                const user = await model.v1.user.show(fastify.mongo.db, { "id": session.user_id })
                if (user === null) {
                    throw new Error("不正なユーザーです")
                }

                const remote = storage.servers[0]
                const urls = await api.v1.media.video.upload(fastify.mongo.db, {
                    "data": buffer,
                    "user_id": user.id,
                    "storage": remote
                })
                memcached.v1.delete_media_list_from_cache(user)
                res.send({ "success": true, urls })
            })
        } catch (error) {
            logger.log({
                "level": "error",
                "stack": error.stack ? error.stack.split("\n") : null,
                error,
            })
            res.send({ "success": false, "error": error.toString() })
        }
    })
    next()
}