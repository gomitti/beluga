import { sha256 } from "js-sha256"
import assert, { is_string } from "../assert"
import model from "../model"
import AccessTokenSession from "../auth/access_token/session"

module.exports = (fastify, options, next) => {

	const authenticate = async (req, res, _csrf_token) => {
		const { access_token, access_token_secret } = req.body
		const { oauth_token, oauth_token_secret } = req.body
		if (access_token && access_token_secret) {
			return authenticate_access_token(access_token, access_token_secret)
		}
		return authenticate_cookie(req, res, _csrf_token)
	}

	const authenticate_access_token = async (access_token, access_token_secret) => {
		assert(is_string(access_token), "@access_token must be string")
		assert(is_string(access_token_secret), "@access_token_secret must be string")
		try {
			const user_id = await model.v1.access_token.authenticate(fastify.mongo.db, {
				"token": access_token,
				"secret": access_token_secret,
			})
			if(user_id){
				return new AccessTokenSession(user_id)
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
	fastify.decorate("parse_bool", value => {
		if (typeof value === "boolean") {
			return value
		}
		if (typeof value === "string") {
			if (value === "false") {
				return false
			}
			if (value === "true") {
				return true
			}
		}
		if (typeof value === "number") {
			if (value === 0) {
				return false
			}
			if (value === 1) {
				return true
			}
		}
		return false
	})
	fastify.register(require("./api/account"))
	fastify.register(require("./api/hashtag"))
	fastify.register(require("./api/media"))
	fastify.register(require("./api/status"))
	fastify.register(require("./api/server"))
	fastify.register(require("./api/user"))
	fastify.register(require("./api/timeline"))
	fastify.register(require("./api/like"))
	fastify.register(require("./api/favorite"))
	fastify.register(require("./api/reaction"))
	fastify.register(require("./api/access_token"))
	next()
}