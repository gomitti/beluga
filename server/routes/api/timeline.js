import * as beluga from "../../api"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.get(`/api/${api_version}/timeline/hashtag`, async (req, res) => {
		try {
			const params = Object.assign({}, req.query)
			if(params.trim_user){
				params.trim_user = fastify.parse_bool(params.trim_user)
			}
			const statuses = await beluga.v1.timeline.hashtag(fastify.mongo.db, params)
			res.send({ "success": true, statuses })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}