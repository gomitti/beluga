module.exports = (fastify, options, next) => {
    fastify.next("/signup", async (app, req, res) => {
        const csrf_token = await fastify.csrf_token(req, res)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/account/signup`, { csrf_token })
    })
    fastify.next("/login", async (app, req, res) => {
        const csrf_token = await fastify.csrf_token(req, res)
        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/account/login`, { csrf_token })
    })
    next()
}