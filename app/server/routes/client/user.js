import memcached from "../../memcached"

module.exports = (fastify, options, next) => {
    fastify.next("/user/:name", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in_user = await fastify.logged_in_user(req, res, session)
        if (logged_in_user === null) {
            return fastify.error(app, req, res, 404)
        }

        const { name } = req.params
        const user = await memcached.v1.user.show(fastify.mongo.db, { name })
        if (user === null) {
            return fastify.error(app, req, res, 404)
        }
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/user/profile`, {
            csrf_token, user, logged_in_user
        })
    })
    next()
}