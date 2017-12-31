const fastify = require("fastify")()
const next = require("next")
const mongodb = require("mongodb")
import * as mongo from "./mongo"
import * as beluga from "./api"

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

// ━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━［ WebSocket ］━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━
import websocket from "./websocket"
websocket
	.register(require("fastify-ws"), {
		"library": "uws"
	})
	.after(() => {
		websocket.ws
			.on("connection", client => {							// ユーザーが接続するたびに呼ばれる
				broadcast("online", websocket.ws.clients.length)		// 全員に通知
				client.on("close", _ => {							// そのユーザーが離脱した場合に呼ばれる
					broadcast("online", websocket.ws.clients.length)	// 全員に通知
				})
			})
	})
websocket.listen(8080, (error) => {
	if (error) {
		throw error
	}
	console.log("WebSocket running on http://localhost:8080")
})

// WebSocketのブロードキャスト用関数
const broadcast = (name, data) => {
	if (websocket.ws == undefined) {
		return
	}
	websocket.ws.clients.forEach(client => {
		client.send(JSON.stringify({
			[name]: data
		}))
	})
}

mongodb.MongoClient
	.connect(mongo.url)
	.then((client) => {
		// ━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━［ API ］━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━
		const db = client.db(mongo.name)
		fastify.register(require("fastify-mongodb"), {
			client: db
		})
		const api_version = "v1"
		fastify.post(`/api/${api_version}/status/update`, async (req, res) => {
			try {
				const result = await beluga.v1.status.update(fastify.mongo.db, req.body)
				broadcast("status_updated", {})
				res.send({"success": true})
			} catch (error) {
				res.send({ "success": false, "error": error.toString()})
			}
		})
		fastify.post("/api/v1/statuses/hashtag", (req, res) => {
			const db = fastify.mongo.db
			const collection = db.collection("statuses")
			let success = false
			let statuses = []
			collection
				.find({}, { sort: { "created_at": -1 }, limit: 30 })
				.toArray()
				.then(documents => {
					statuses = documents
					success = true
				}).catch(error => {
					success = false
				}).then(document => {
					res.send({ success, statuses })
				})
		})
		fastify.post(`/api/${api_version}/user/signup`, async (req, res) => {
			const ip_address = req.headers["x-real-ip"]
			const params = Object.assign({ ip_address }, req.body)
			try {
				const result = await beluga.v1.user.signup(fastify.mongo.db, params)
				res.send({ "success": true })
			} catch (error) {
				res.send({ "success": false, "error": error.toString() })
			}
		})

		// ━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━［ Client ］━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━
		fastify.register(require("fastify-static"), {
		})
		fastify
			.register(require("fastify-react"))
			.after(() => {
				fastify.next("/", (app, req, res) => {
					const db = fastify.mongo.db
					const collection = db.collection("statuses")
					let statuses = []
					collection
						.find({}, { sort: { "created_at": -1 }, limit: 30 })
						.toArray()
						.then(documents => {
							statuses = documents
						}).catch(error => {
						}).then(document => {
							app.render(req.req, res.res, "/", { statuses })
						})
				})
				fastify.next("/signup", (app, req, res) => {
					app.render(req.req, res.res, "/signup", {})
				})

				// Nextは.jsを動的に生成するため、最初の1回はここで生成する
				// 2回目以降はNginxのproxy_cacheが効くのでここは呼ばれない
				fastify.get("/_next/*", (req, res) => {
					handle(req.req, res.res)
				})

			})

		fastify.listen(3000, (error) => {
			if (error) {
				throw error
			}
			console.log("Beluga running on http://localhost:3000")
		})
	})
	.catch((error) => {
		console.log(error)
	})

