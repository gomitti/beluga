import config from "../../config/beluga"
import model from "../../model"
import timeline from "../../timeline"
import collection from "../../collection"
import { hash } from "bcrypt/bcrypt"
import assert from "../../assert"

module.exports = (fastify, options, next) => {
	// オンラインのユーザーを取得
	fastify.decorate("members", async (server, logged_in) => {
		const online_user_ids = fastify.online.users(server)
		const member = []
		let including_me = false
		for (const user_id of online_user_ids) {
			const user = await model.v1.user.show(fastify.mongo.db, { "id": user_id })
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
			const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
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
			}, req.query)
			if(session.user_id){
				params.user_id = session.user_id
			}
			if(params.count){
				params.count = parseInt(params.count)
			}
			const statuses = await timeline.v1.server(fastify.mongo.db, params)
			const hashtags = await model.v1.server.hashtags(fastify.mongo.db, { "id": server.id })
			assert(statuses instanceof Array, "@hashtags must be an array")
			assert(hashtags instanceof Array, "@hashtags must be an array")

			let media_favorites = null
			let media_history = null
			let emoji_favorites = null
			if (logged_in) {
				media_favorites = await collection.v1.account.favorite.media.list(fastify.mongo.db, { "user_id": logged_in.id })
				media_history = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
				emoji_favorites = await model.v1.account.favorite.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
				assert(media_favorites instanceof Array, "@media_favorites must be an array")
				assert(media_history instanceof Array, "@media_history must be an array")
				assert(emoji_favorites instanceof Array, "@emoji_favorites must be an array")
			}

			server.members = await fastify.members(server, logged_in)
			assert(server.members instanceof Array, "@server.members must be an array")
			fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

			app.render(req.req, res.res, `/${fastify.device_type(req)}/${fastify.theme(req)}/server/hashtags`, {
				csrf_token, server, statuses, logged_in, hashtags, 
				"platform": fastify.platform(req),
				"request_query": req.query,
				media_favorites, media_history, emoji_favorites
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
			const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
			if (server === null) {
				return fastify.error(app, req, res, 404)
			}

			const tagname = req.params.tagname
			const hashtag = await model.v1.hashtag.show(fastify.mongo.db, {
				"server_id": server.id, tagname
			})
			if (hashtag === null) {
				return fastify.error(app, req, res, 404)
			}
			const params = Object.assign({
				"id": hashtag.id,
				"trim_user": false,
				"trim_favorited_by": false,
				"trim_server": false,
			}, req.query)
			if (session.user_id) {
				params.user_id = session.user_id
			}
			if (params.count) {
				params.count = parseInt(params.count)
			}
			const statuses = await timeline.v1.hashtag(fastify.mongo.db, params)
			const hashtags = await model.v1.server.hashtags(fastify.mongo.db, { "id": server.id })
			assert(statuses instanceof Array, "@hashtags must be an array")
			assert(hashtags instanceof Array, "@hashtags must be an array")

			let media_favorites = null
			let media_history = null
			let emoji_favorites = null
			if (logged_in) {
				media_favorites = await collection.v1.account.favorite.media.list(fastify.mongo.db, { "user_id": logged_in.id })
				media_history = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
				emoji_favorites = await model.v1.account.favorite.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
				assert(media_favorites instanceof Array, "@media_favorites must be an array")
				assert(media_history instanceof Array, "@media_history must be an array")
				assert(emoji_favorites instanceof Array, "@emoji_favorites must be an array")
			}

			server.members = await fastify.members(server, logged_in)
			assert(server.members instanceof Array, "@server.members must be an array")
			fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

			app.render(req.req, res.res, `/${fastify.device_type(req)}/${fastify.theme(req)}/server/hashtag`, {
				csrf_token, server, hashtag, logged_in, hashtags, statuses,
				"platform": fastify.platform(req),
				"request_query": req.query,
				media_favorites, media_history, emoji_favorites
			})
		} catch (error) {
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
			const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
			if (server === null) {
				return fastify.error(app, req, res, 404)
			}
			const user = await model.v1.user.show(fastify.mongo.db, {
				"name": req.params.user_name
			})
			if (user === null) {
				return fastify.error(app, req, res, 404)
			}
			const params = Object.assign({
				"user_id": user.id,
				"server_id": server.id,
				"trim_user": false,
				"trim_favorited_by": false,
				"trim_server": false,
			}, req.query)
			if (params.count) {
				params.count = parseInt(params.count)
			}
			const statuses = await timeline.v1.home(fastify.mongo.db, params)
			const hashtags = await model.v1.server.hashtags(fastify.mongo.db, { "id": server.id })
			assert(statuses instanceof Array, "@hashtags must be an array")
			assert(hashtags instanceof Array, "@hashtags must be an array")

			let media_favorites = null
			let media_history = null
			let emoji_favorites = null
			if (logged_in) {
				media_favorites = await collection.v1.account.favorite.media.list(fastify.mongo.db, { "user_id": logged_in.id })
				media_history = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
				emoji_favorites = await model.v1.account.favorite.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
				assert(media_favorites instanceof Array, "@media_favorites must be an array")
				assert(media_history instanceof Array, "@media_history must be an array")
				assert(emoji_favorites instanceof Array, "@emoji_favorites must be an array")
			}

			// ホームの最初の投稿は本人以外にはできなくする
			if (statuses.length === 0) {
				if (session.user_id.equals(user.id) === false) {
					return fastify.error(app, req, res, 404)
				}
			}

			server.members = await fastify.members(server, logged_in)
			assert(server.members instanceof Array, "@server.members must be an array")
			fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

			app.render(req.req, res.res, `/${fastify.device_type(req)}/${fastify.theme(req)}/server/home`, {
				csrf_token, server, user, logged_in, hashtags, statuses,
				"platform": fastify.platform(req),
				"request_query": req.query,
				media_favorites, media_history, emoji_favorites
			})
		} catch (error) {
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
			const server = await model.v1.server.show(fastify.mongo.db, { "name": server_name })
			if (server === null) {
				return fastify.error(app, req, res, 404)
			}
			let statuses_home = null
			if (session.user_id) {
				const params = Object.assign({
					"user_id": session.user_id,
					"server_id": server.id,
					"trim_user": false,
					"trim_favorited_by": false,
					"trim_server": false,
				}, req.query)
				if (session.user_id) {
					params.user_id = session.user_id
				}
				if (params.count) {
					params.count = parseInt(params.count)
				}
				statuses_home = await timeline.v1.home(fastify.mongo.db, params)
				assert(statuses_home instanceof Array)
			}
			const params = Object.assign({
				"server_id": server.id,
				"trim_user": false,
				"trim_server": false,
				"trim_hashtag": false,
				"trim_favorited_by": false,
				"trim_recipient": false
			}, req.query)
			if (session.user_id) {
				params.user_id = session.user_id
			}
			if (params.count) {
				params.count = parseInt(params.count)
			}
			const statuses_server = await timeline.v1.server(fastify.mongo.db, params)
			const hashtags = await model.v1.server.hashtags(fastify.mongo.db, { "id": server.id })
			server.members = await fastify.members(server, logged_in)
			assert(server.members instanceof Array, "@server.members must be an array")
			assert(hashtags instanceof Array, "@hashtags must be an array")
			assert(statuses_server instanceof Array, "@statuses_server must be an array")

			// オンラインを更新
			fastify.websocket_broadcast("members_changed", { "members": server.members, "id": server.id })

			let media_favorites = null
			let media_history = null
			let emoji_favorites = null
			if(logged_in){
				media_favorites = await collection.v1.account.favorite.media.list(fastify.mongo.db, { "user_id": logged_in.id })
				media_history = await collection.v1.media.list(fastify.mongo.db, { "user_id": logged_in.id, "count": 100 })
				emoji_favorites = await model.v1.account.favorite.emoji.list(fastify.mongo.db, { "user_id": logged_in.id })
				assert(media_favorites instanceof Array, "@media_favorites must be an array")
				assert(media_history instanceof Array, "@media_history must be an array")
				assert(emoji_favorites instanceof Array, "@emoji_favorites must be an array")
			}

			app.render(req.req, res.res, `/${fastify.device_type(req)}/${fastify.theme(req)}/world`, {
				csrf_token, server, logged_in, hashtags, 
				"platform": fastify.platform(req),
				"request_query": req.query,
				statuses_home, statuses_server, media_favorites, media_history, emoji_favorites
			})
		} catch (error) {
			return fastify.error(app, req, res, 500)
		}
	})
	next()
}