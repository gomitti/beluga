import beluga from "../../api"

module.exports = (fastify, options, next) => {
	let api_version = "v1"
	fastify.post(`/api/${api_version}/server/create`, async (req, res) => {
		try {
			const session = await fastify.authenticate_session(req, res)
			if (!!session.user_id === false) {
				throw new Error("ログインしてください")
			}
			const params = Object.assign({}, req.body, { "user_id": session.user_id })
			const server = await beluga.v1.server.create(fastify.mongo.db, params)

			// ルームを作成する
			const query = { "tagname": "public", "server_id": server._id, "user_id": session.user_id }
			try {
				const hashtag = await beluga.v1.hashtag.create(fastify.mongo.db, query)
			} catch (error) {
				// ロールバック
				const result = await beluga.v1.server.destroy(fastify.mongo.db, {
					"server_id": server._id,
					"user_id": session.user_id
				})
				throw new Error("サーバーで問題が発生しました")
			}
			res.send({ "success": true, server })
		} catch (error) {
			res.send({ "success": false, "error": error.toString() })
		}
	})
	next()
}