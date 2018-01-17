const plugin = require("fastify-plugin")
const uid = require("uid-safe").sync
const signature = require("cookie-signature")
import Session from "./session/session"
import Store from "./session/store"
import { setInterval } from "timers";

const session = (fastify, options, next) => {
	if (!fastify.mongo) {
		throw new Error("MongoDB not found.")
	}
	const db = fastify.mongo.db
	const store = new Store(db)
	const cookie_name = options.cookie_name || "session_id"
	const secret = options.secret
	const timezone_offset = options.timezone_offset
	const _cookie_options = options.cookie_options || {}

	if (!secret) {
		next(new Error("secret option is required!"))
		return
	}
	if (!_cookie_options.max_age) {
		next(new Error("max_age option is required!"))
		return
	}

	// 期限切れのセッションを削除
	setInterval(() => {
		store.clean()
	}, 3600 * 1000)

	const get_session_by = async encrypted_session_id => {
		if (typeof encrypted_session_id !== "string") {
			return null
		}
		const session = await store.get(encrypted_session_id)
		if (session === null) {
			return null
		}
		const session_id = signature.unsign(`${session.id}.${encrypted_session_id}`, secret)
		if (session_id === false) {
			return null
		}
		if (session_id !== session.id) {
			return null
		}
		return session
	}
	const start_session = async (request, reply) => {
		const url = request.req.url
		if (url.indexOf(_cookie_options.path || "/") !== 0) {
			return null
		}
		let encrypted_session_id = request.cookies[cookie_name]
		if (typeof encrypted_session_id !== "string") {
			return await start_anonymous_session(reply, secret)
		}
		const session = await store.get(encrypted_session_id)
		if (session === null) {
			return await start_anonymous_session(reply, secret)
		}
		const session_id = signature.unsign(`${session.id}.${encrypted_session_id}`, secret)
		if (session_id === false) {
			return await start_anonymous_session(reply, secret)
		}
		if (session_id !== session.id) {
			return await start_anonymous_session(reply, secret)
		}
		return session
	}
	const start_anonymous_session = async (reply, secret) => {
		const session = generate_session()
		await store.save(session)
		const options = get_cookie_options()
		reply.setCookie(cookie_name, session.encrypted_id, options)
		return session
	}
	const generate_session = () => {
		const session_id = uid(24)
		const encrypted_session_id = signature.sign(session_id, secret).split(".")[1]
		const expires = Date.now() + _cookie_options.max_age * 1000
		return new Session(session_id, encrypted_session_id, null, expires)
	}
	const destroy_session = async (encrypted_id, reply) => {
		await store.destroy(encrypted_id)
		const options = get_cookie_options()
		reply.setCookie(cookie_name, encrypted_id, Object.assign({}, options, {
			"expires": 0
		}))
		return true
	}
	const get_cookie_options = () => {
		return {
			"path": typeof _cookie_options.path !== "undefined" ? _cookie_options.path : "/",
			"httpOnly": typeof _cookie_options.http_only !== "undefined" ? _cookie_options.http_only : true,
			"secure": typeof _cookie_options.secure !== "undefined" ? _cookie_options.secure : true,
			"expires": get_expires(_cookie_options),
			"sameSite": typeof _cookie_options.same_site !== "undefined" ? _cookie_options.same_site : false,
			"domain": typeof _cookie_options.domain !== "undefined" ? _cookie_options.domain : null
		}
	}
	const get_expires = () => {
		let expires = null
		if (_cookie_options.expires) {
			expires = _cookie_options.expires
		} else if (_cookie_options.max_age) {
			expires = new Date(Date.now() + (_cookie_options.max_age + timezone_offset) * 1000)	// Date.now()はミリ秒
		}
		return expires
	}
	class SessionManager {
		async generate(reply, user_id) {
			const session = generate_session()
			session.user_id = user_id
			await store.save(session)
			const options = get_cookie_options()
			reply.setCookie(cookie_name, session.encrypted_id, options)
			return session
		}
		async destroy(reply, session) {
			return await destroy_session(session.encrypted_id, reply)
		}
		async start(request, reply) {
			return await start_session(request, reply)
		}
		async get(encrypted_id) {
			if (typeof encrypted_id !== "string") {
				return null
			}
			return await get_session_by(encrypted_id)
		}
	}
	fastify.decorate("session", new SessionManager())
	next()
}

module.exports = plugin(session)