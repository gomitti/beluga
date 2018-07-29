import model from "../../model"
import memcached from "../../memcached"
import assert, { is_object } from "../../assert"
import { try_convert_to_object_id } from "../../lib/object_id"

module.exports = (fastify, options, next) => {
    fastify.next("/customize/:server_name/emoji", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }

        const server_name = req.params.server_name
        const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
        if (server === null) {
            return fastify.error(app, req, res, 404)
        }

        const custome_emoji = await memcached.v1.emoji.list(fastify.mongo.db, { "server_id": server.id })

        for (const emoji of custome_emoji) {
            const user = await memcached.v1.user.show(fastify.mongo.db, { "id": emoji.added_by })
            assert(is_object(user), "@user must be of type object")
            emoji.user = user
        }

        const device = fastify.device(req)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${device}/customize/emoji`, {
            csrf_token, logged_in, device, server, custome_emoji,
            "platform": fastify.platform(req),
        })
    })
    next()
}