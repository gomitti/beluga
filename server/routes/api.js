import assert, { is_string } from "../assert"
import model from "../model"

module.exports = (fastify, options, next) => {
    fastify
        .register(require("./api/v1/account"))
        .register(require("./api/v1/hashtag"))
        .register(require("./api/v1/media"))
        .register(require("./api/v1/status"))
        .register(require("./api/v1/server"))
        .register(require("./api/v1/user"))
        .register(require("./api/v1/timeline"))
        .register(require("./api/v1/like"))
        .register(require("./api/v1/favorite"))
        .register(require("./api/v1/reaction"))
        .register(require("./api/v1/access_token"))
    next()
}