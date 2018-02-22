import timeline from "../../timeline"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.get(`/api/${api_version}/timeline/hashtag`, async (req, res) => {
		try {
			const params = Object.assign({
				// 何か
			}, req.query)
			if (params.trim_user) {
				params.trim_user = fastify.parse_bool(params.trim_user)
			}
			if (params.trim_hashtag) {
				params.trim_hashtag = fastify.parse_bool(params.trim_hashtag)
			}
			if (params.trim_server) {
				params.trim_server = fastify.parse_bool(params.trim_server)
			}
			if (params.trim_recipient) {
				params.trim_recipient = fastify.parse_bool(params.trim_recipient)
			}
			const statuses = await timeline.v1.hashtag(fastify.mongo.db, params)
			res.send({ "success": true, statuses })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.get(`/api/${api_version}/timeline/home`, async (req, res) => {
		try {
			const params = Object.assign({
				// 何か
			}, req.query)
			if (params.trim_user) {
				params.trim_user = fastify.parse_bool(params.trim_user)
			}
			if (params.trim_hashtag) {
				params.trim_hashtag = fastify.parse_bool(params.trim_hashtag)
			}
			if (params.trim_server) {
				params.trim_server = fastify.parse_bool(params.trim_server)
			}
			if (params.trim_recipient) {
				params.trim_recipient = fastify.parse_bool(params.trim_recipient)
			}
			const statuses = await timeline.v1.home(fastify.mongo.db, params)
			res.send({ "success": true, statuses })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	fastify.get(`/api/${api_version}/timeline/server`, async (req, res) => {
		try {
			const params = Object.assign({
				// 何か
			}, req.query)
			if (params.trim_user) {
				params.trim_user = fastify.parse_bool(params.trim_user)
			}
			if (params.trim_hashtag) {
				params.trim_hashtag = fastify.parse_bool(params.trim_hashtag)
			}
			if (params.trim_server) {
				params.trim_server = fastify.parse_bool(params.trim_server)
			}
			if (params.trim_recipient) {
				params.trim_recipient = fastify.parse_bool(params.trim_recipient)
			}
			const statuses = await timeline.v1.server(fastify.mongo.db, params)
			res.send({ "success": true, statuses })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}