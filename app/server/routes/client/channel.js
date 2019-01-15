import memcached from "../../memcached"
import model from "../../model"

module.exports = (fastify, options, next) => {
    fastify.next("/server/:server_name/:channel_name/settings/profile", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in_user = await fastify.logged_in_user(req, res, session)
        if (logged_in_user === null) {
            return fastify.error(app, req, res, 404)
        }

        const { server_name, channel_name } = req.params
        const server = await memcached.v1.server.show(fastify.mongo.db, { "name": server_name })
        if (server === null) {
            return fastify.error(app, req, res, 404)
        }
        const channel = await memcached.v1.channel.show(fastify.mongo.db, {
            "name": channel_name, "server_id": server.id
        })
        if (channel === null) {
            return fastify.error(app, req, res, 404)
        }
        if (channel.created_by.equals(logged_in_user.id) === false) {
            return fastify.error(app, req, res, 404)
        }

        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/channel/settings/profile`, {
            csrf_token, server, channel, logged_in_user,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/server/:server_name/:channel_name/settings/access_control", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in_user = await fastify.logged_in_user(req, res, session)
        if (logged_in_user === null) {
            return fastify.error(app, req, res, 404)
        }

        const { server_name, channel_name } = req.params
        const server = await memcached.v1.server.show(fastify.mongo.db, { "name": server_name })
        if (server === null) {
            return fastify.error(app, req, res, 404)
        }
        const channel = await memcached.v1.channel.show(fastify.mongo.db, {
            "name": channel_name, "server_id": server.id
        })
        if (channel === null) {
            return fastify.error(app, req, res, 404)
        }
        if (channel.created_by.equals(logged_in_user.id) === false) {
            return fastify.error(app, req, res, 404)
        }

        const members_in_channel = await model.v1.channel.members(fastify.mongo.db, { "id": channel.id })
        const members_in_server = await model.v1.server.members(fastify.mongo.db, { "id": channel.server_id })

        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/channel/settings/access_control`, {
            csrf_token, server, channel, logged_in_user, members_in_channel, members_in_server,
            "platform": fastify.platform(req),
        })
    })
    next()
}