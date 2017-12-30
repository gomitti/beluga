const fastify = require("fastify")()
const next = require("next")
const mongodb = require("mongodb")
import * as mongo from "./mongo"

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

// WebSocketのブロードキャスト用関数
const broadcast = (name, data) => {
	if(fastify.ws == undefined){
		return
	}
	fastify.ws.clients.forEach(client => {
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
		fastify.post("/api/v1/status/update", (req, res) => {
			if (req.body.text.length > 3000){
				res.send({ "success": false, "error": "本文は3000文字以内で入力してください" })
				return
			}
			const db = fastify.mongo.db
			const collection = db.collection("statuses")
			let success = false
			collection
				.insertOne({
					"text": req.body.text,
					"user_name": req.body.user_name,
					"created_at": new Date().getTime()
				}).then(document => {
					success = true
					broadcast("status_updated", {})
				}).catch(error => {
					success = false
				}).then(document => {
					if (fastify.ws){
						res.send({ success, "connection": fastify.ws.clients.length })
					}else{
						res.send({ success })
					}
				})
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

		// ━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━［ WebSocket ］━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━
		fastify
			.register(require("fastify-ws"), {
				"library": "uws"
			})
			.after(() => {
				fastify.ws
					.on("connection", client => {							// ユーザーが接続するたびに呼ばれる
						broadcast("online", fastify.ws.clients.length)		// 全員に通知
						client.on("close", _ => {							// そのユーザーが離脱した場合に呼ばれる
							broadcast("online", fastify.ws.clients.length)	// 全員に通知
						})
					})
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

				// Nextは.jsを動的に生成するため、最初の1回はここで生成する
				// 2回目以降はNginxのproxy_cacheが効くのでここは呼ばれない
				fastify.get("/_next/*", (req, res) => {
					handle(req.req, res.res)
				})

				fastify.get("/css/style.css", (req, res) => {
					res.sendFile("/css/style.css")
				})

			})

		fastify.listen(3000, (error) => {
			if (error){
				throw error
			} 
			console.log("Beluga running on http://localhost:3000")
		})
	})
	.catch((error) => {
		console.log(error)
	})

