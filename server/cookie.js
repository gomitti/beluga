"use strict"

const fp = require("fastify-plugin")
const cookie = require("cookie")

function set_cookie(name, value, options) {
    const opts = Object.assign({}, options || {})
    if (opts.expires && Number.isInteger(opts.expires)) {
        opts.expires = new Date(opts.expires)
    }
    const serialized = cookie.serialize(name, value, opts)

    let setCookie = this.res.getHeader("Set-Cookie")
    if (!!setCookie === false) {
        this.header("Set-Cookie", serialized)
        this.res.setHeader("Set-Cookie", serialized)
        return this
    }

    if (typeof setCookie === "string") {
        setCookie = [setCookie]
    }

    setCookie.push(serialized)
    this.header("Set-Cookie", setCookie)
    this.res.setHeader("Set-Cookie", serialized)
    return this
}

function pre_handler(fastifyReq, fastifyRes, done) {
    const cookieHeader = fastifyReq.req.headers.cookie
    fastifyReq.cookies = (cookieHeader) ? cookie.parse(cookieHeader) : {}
    done()
}

function plugin(fastify, options, next) {
    fastify.decorateRequest("cookies", {})
    fastify.decorateReply("setCookie", set_cookie)
    fastify.addHook("preHandler", pre_handler)
    next()
}

module.exports = fp(plugin)