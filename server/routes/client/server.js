import api from "../../api"
import memcached from "../../memcached"
import config from "../../config/beluga"
import model from "../../model"
import { hash } from "bcrypt/bcrypt"

module.exports = (fastify, options, next) => {
	// オンラインのユーザーを取得
	fastify.decorate("members", async (server, logged_in) => {
		const online_user_ids = fastify.online.users(server)
		const member = []
		let including_me = false
		for (const user_id of online_user_ids) {
			const user = await memcached.v1.user.show(fastify.mongo.db, { "id": user_id })
			if (user) {
				member.push(user)
				if (logged_in && user.id.equals(logged_in.id)) {
					including_me = true
				}
			}
		}
		if (logged_in && including_me === false) {
			member.push(logged_in)
		}
		return member
	})
	// サーバー作成
	fastify.next("/server/create", async (app, req, res) => {
		const csrf_token = await fastify.csrf_token(req, res)
		app.render(req.req, res.res, `/${fastify.device_type(req)}/common/server/create`, { csrf_token })
	})
	// ルーム一覧
	fastify.next("/server/:server_name/hashtags", async (app, req, res) => {
		try {
			const session = await fastify.session.start(req, res)
			const csrf_token = await fastify.csrf_token(req, res, session)
			const logged_in = await fastify.logged_in(req, res, session)

			const server_name = req.params.server_name
			const server = await memcached.v1.server.show(fastify.mongo.db, { "name": server_name })
			if (server === null) {
				return fastify.error(app, req, res, 404)
			}

			const params = Object.assign({
				"server_id": server.id,
				"trim_user": false,
				"trim_favorited_by": false,
				"trim_server": false,
				"trim_hashtag": false,
				"trim_recipient": false
			}, req.body)
			if(session.user_id){
				params.user_id = session.user_id
			}
			const statuses = await model.v1.timeline.server(fastify.mongo.db, params)

			const hashtags = await api.v1.server.hashtags(fastify.mongo.db, { "id": server.id })

			let media = []
			if (session.user_id) {
				media = await api.v1.media.list(fastify.mongo.db, { "user_id": session.user_id })
			}

			server.members = await fastify.members(server, logged_in)
			fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

			app.render(req.req, res.res, `/${fastify.device_type(req)}/${fastify.theme(req)}/server/hashtags`, {
				csrf_token, server, statuses, logged_in, hashtags, media, "platform": fastify.platform(req)
			})
		} catch (error) {
			console.log(error)
			return fastify.error(app, req, res, 500)
		}
	})
	// 各ルーム
	fastify.next("/server/:server_name/:tagname", async (app, req, res) => {
		try {
			const session = await fastify.session.start(req, res)
			const csrf_token = await fastify.csrf_token(req, res, session)
			const logged_in = await fastify.logged_in(req, res, session)

			const server_name = req.params.server_name
			const server = await memcached.v1.server.show(fastify.mongo.db, { "name": server_name })
			if (server === null) {
				return fastify.error(app, req, res, 404)
			}
			const tagname = req.params.tagname
			const hashtag = await memcached.v1.hashtag.show(fastify.mongo.db, {
				"server_id": server.id, tagname
			})
			if (hashtag === null) {
				return fastify.error(app, req, res, 404)
			}

			const params = Object.assign({
				"id": hashtag.id,
				"trim_user": false,
				"trim_favorited_by": false,
			}, req.body)
			if (session.user_id) {
				params.user_id = session.user_id
			}
			const statuses = await model.v1.timeline.hashtag(fastify.mongo.db, params)

			const hashtags = await api.v1.server.hashtags(fastify.mongo.db, { "id": server.id })

			let media = []
			if(session.user_id){
				media = await api.v1.media.list(fastify.mongo.db, { "user_id": session.user_id })
			}

			server.members = await fastify.members(server, logged_in)
			fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

			app.render(req.req, res.res, `/${fastify.device_type(req)}/${fastify.theme(req)}/server/hashtag`, {
				csrf_token, server, hashtag, statuses, logged_in, hashtags, media,
				"platform": fastify.platform(req)
			})
		} catch (error) {
			console.log(error)
			return fastify.error(app, req, res, 500)
		}
	})
	// ホーム
	fastify.next("/server/:server_name/@:user_name", async (app, req, res) => {
		try {
			const session = await fastify.session.start(req, res)
			if (!session.user_id) {
				return fastify.error(app, req, res, 404)
			}
			const csrf_token = await fastify.csrf_token(req, res, session)
			const logged_in = await fastify.logged_in(req, res, session)

			const server_name = req.params.server_name
			const server = await api.v1.server.show(fastify.mongo.db, { "name": server_name })
			if (server === null) {
				return fastify.error(app, req, res, 404)
			}
			const user = await api.v1.user.show(fastify.mongo.db, {
				"name": req.params.user_name
			})
			if (user === null) {
				return fastify.error(app, req, res, 404)
			}
			const statuses = await model.v1.timeline.home(fastify.mongo.db, Object.assign({
				"user_id": user.id,
				"server_id": server.id,
				"trim_user": false,
				"trim_favorited_by": false,
			}, req.body))

			const hashtags = await api.v1.server.hashtags(fastify.mongo.db, { "id": server.id })

			let media = []
			if (session.user_id) {
				media = await api.v1.media.list(fastify.mongo.db, { "user_id": session.user_id })
			}

			// ホームの最初の投稿は本人以外にはできなくする
			if (statuses.length === 0) {
				if (session.user_id.equals(user.id) === false) {
					return fastify.error(app, req, res, 404)
				}
			}

			server.members = await fastify.members(server, logged_in)
			fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

			app.render(req.req, res.res, `/${fastify.device_type(req)}/${fastify.theme(req)}/server/home`, {
				csrf_token, server, user, statuses, logged_in, hashtags, media, 
				"platform": fastify.platform(req)
			})
		} catch (error) {
			console.log(error)
			return fastify.error(app, req, res, 500)
		}
	})
	// サーバータイムライン
	fastify.next(`/${config.slug.timeline.server}/:server_name`, async (app, req, res) => {
		try {
			const session = await fastify.session.start(req, res)
			const csrf_token = await fastify.csrf_token(req, res, session)
			const logged_in = await fastify.logged_in(req, res, session)

			const server_name = req.params.server_name
			const server = await api.v1.server.show(fastify.mongo.db, { "name": server_name })
			if (server === null) {
				return fastify.error(app, req, res, 404)
			}
			let home_statuses = null
			if (session.user_id) {
				const params = Object.assign({
					"user_id": session.user_id,
					"server_id": server.id,
					"trim_user": false,
					"trim_favorited_by": false,
				}, req.body)
				if (session.user_id) {
					params.user_id = session.user_id
				}
				home_statuses = await model.v1.timeline.home(fastify.mongo.db, params)
			}
			const params = Object.assign({
				"server_id": server.id,
				"trim_user": false,
				"trim_server": false,
				"trim_hashtag": false,
				"trim_favorited_by": false,
				"trim_recipient": false
			}, req.body)
			if (session.user_id) {
				params.user_id = session.user_id
			}
			const server_statuses = await model.v1.timeline.server(fastify.mongo.db, params)

			const hashtags = await api.v1.server.hashtags(fastify.mongo.db, { "id": server.id })

			let media = []
			if (session.user_id) {
				media = await api.v1.media.list(fastify.mongo.db, { "user_id": session.user_id })
			}

			server.members = await fastify.members(server, logged_in)
			fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

			app.render(req.req, res.res, `/${fastify.device_type(req)}/${fastify.theme(req)}/world`, {
				csrf_token, server, logged_in, hashtags, media, "platform": fastify.platform(req),
				"statuses": {
					"home": home_statuses,
					"server": server_statuses
				}
			})
		} catch (error) {
			console.log(error)
			return fastify.error(app, req, res, 500)
		}
	})
	next()
}