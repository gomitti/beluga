import plugin from "fastify-plugin"
import { sha256 } from "js-sha256"
import assert, { is_string } from "../assert"
import Session from "./access_token/session"
import model from "../model"

module.exports = plugin((fastify, options, next) => {
    const authenticate = async (req, res, _csrf_token) => {
        const { access_token, access_token_secret } = req.body
        const { oauth_token, oauth_token_secret } = req.body
        if (access_token && access_token_secret) {
            return authenticate_access_token(access_token, access_token_secret)
        }
        return authenticate_cookie(req, res, _csrf_token)
    }
    const authenticate_access_token = async (access_token, access_token_secret) => {
        assert(is_string(access_token), "@access_token must be of type string")
        assert(is_string(access_token_secret), "@access_token_secret must be of type string")
        try {
            const user_id = await model.v1.access_token.authenticate(fastify.mongo.db, {
                "token": access_token,
                "secret": access_token_secret,
            })
            if (user_id) {
                return new Session(user_id)
            }
        } catch (error) {

        }
        throw new Error("不正なAPIキーです")
    }
    const authenticate_cookie = async (req, res, _csrf_token) => {
        const session = await fastify.session.start(req, res)
        const true_csrf_token = sha256(session.id)
        const csrf_token = _csrf_token ? _csrf_token : req.body.csrf_token
        if (csrf_token !== true_csrf_token) {
            throw new Error("ページの有効期限が切れました。ページを更新してください。")
        }
        return session
    }
    // fastify.addHook("preHandler")はどうやらfastify.postした数だけ呼ばれるみたいなのでhookは使わない
    fastify.decorate("authenticate", authenticate)
    fastify.decorate("authenticate_cookie", authenticate_cookie)
    fastify.decorate("authenticate_access_token", authenticate_access_token)
    next()
})