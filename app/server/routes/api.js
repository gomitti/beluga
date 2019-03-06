import assert, { is_string } from "../assert"
import model from "../model"

module.exports = (fastify, options, next) => {
    fastify
        .register(require("./api/v1/account"))
        .register(require("./api/v1/channel"))
        .register(require("./api/v1/media"))
        .register(require("./api/v1/status"))
        .register(require("./api/v1/community"))
        .register(require("./api/v1/users"))
        .register(require("./api/v1/user"))
        .register(require("./api/v1/timeline"))
        .register(require("./api/v1/like"))
        .register(require("./api/v1/favorite"))
        .register(require("./api/v1/reaction"))
        .register(require("./api/v1/access_token"))
        .register(require("./api/v1/kvs"))
        .register(require("./api/v1/channels"))
        .register(require("./api/v1/emoji"))
        .register(require("./api/v1/mute"))
    next()
}