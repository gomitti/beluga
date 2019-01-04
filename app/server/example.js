"use strict"
const fastify = require("fastify")({})

fastify.register(require("fastify-react"))
fastify.after(() => {
    fastify.next("/", async (app, req, res) => {
        app.render(req.req, res.res, `/theme/default/desktop/entrance`, {
            "channels": {},
            "logged_in": {}
        })
    })
})
fastify.listen(3000, (error) => {
    if (error) {
        throw error
    }
})
