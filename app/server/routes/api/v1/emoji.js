import model from "../../../model"
import config from "../../../config/beluga"
import assign from "../../../lib/assign";

module.exports = (fastify, options, next) => {
    fastify.register(require("fastify-multipart"), {
        "limits": {
            "fileSize": config.emoji.max_filesize,
        }
    })
    fastify.post(`/api/v1/emoji/add`, async (req, res) => {
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
                const { shortname } = fields
                if (!!shortname === false) {
                    throw new Error("タグ名を指定してください")
                }

                const { server_id } = fields
                if (!!server_id === false) {
                    throw new Error("サーバーを指定してください")
                }

                const session = await fastify.authenticate(req, res, csrf_token)
                if (session.user_id === null) {
                    throw new Error("ログインしてください")
                }

                if (buffer === null) {
                    throw new Error("画像を指定してください")
                }
                
                try {
                    await model.v1.emoji.add(fastify.mongo.db, {
                        "data": buffer,
                        "user_id": session.user_id,
                        "server_id": server_id,
                        "shortname": shortname
                    })
                    fastify.websocket_broadcast("emoji_added", { shortname })
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