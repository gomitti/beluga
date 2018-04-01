import api from "../../api"

module.exports = (fastify, options, next) => {
    fastify.next("/hashtag/:server_name/create", async (app, req, res) => {
        const csrf_token = await fastify.csrf_token(req, res)
        const { server_name } = req.params
        const server = await api.v1.server.show(fastify.mongo.db, { "name": server_name })
        if (server === null) {
            return fastify.error(app, req, res, 404)
        }
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/hashtag/create`, {
            csrf_token, server
        })
    })
    fastify.next("/hashtag/:server_name/:tagname/edit", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in = await fastify.logged_in(req, res, session)
        if (logged_in === null) {
            return fastify.error(app, req, res, 404)
        }

        const { server_name, tagname } = req.params
        const server = await api.v1.server.show(fastify.mongo.db, { "name": server_name })
        if (server === null) {
            return fastify.error(app, req, res, 404)
        }
        const hashtag = await api.v1.hashtag.show(fastify.mongo.db, { tagname, "server_id": server.id })
        if (hashtag === null) {
            return fastify.error(app, req, res, 404)
        }
        if (hashtag.created_by.equals(logged_in.id) === false) {
            return fastify.error(app, req, res, 404)
        }

        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/hashtag/edit`, {
            csrf_token, server, hashtag, logged_in, server,
            "platform": fastify.platform(req),
        })
    })
    next()
}