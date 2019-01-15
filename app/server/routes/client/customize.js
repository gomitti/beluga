import model from "../../model"
import memcached from "../../memcached"
import assert, { is_object } from "../../assert"
import { try_convert_to_object_id } from "../../lib/object_id"

module.exports = (fastify, options, next) => {
    fastify.next("/customize/:server_name/emoji", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in_user = await fastify.logged_in_user(req, res, session)
        if (logged_in_user === null) {
            return fastify.error(app, req, res, 404)
        }

        const server_name = req.params.server_name
        const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
        if (server === null) {
            return fastify.error(app, req, res, 404)
        }

        const custom_emoji_list = await memcached.v1.emoji.list(fastify.mongo.db, { "server_id": server.id })

        for (let j = 0; j < custom_emoji_list.length; j++) {
            const emoji = custom_emoji_list[j]
            const user = await memcached.v1.user.show(fastify.mongo.db, { "id": emoji.added_by })
            assert(is_object(user), "$user must be of type object")
            emoji.user = user
        }

        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/customize/emoji`, {
            csrf_token, logged_in_user, device, server, custom_emoji_list,
            "platform": fastify.platform(req),
        })
    })
    next()
}