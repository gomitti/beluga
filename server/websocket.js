const websocket = require("fastify")()

// const fs = require("fs")
// const websocket = require("fastify")({
// 	https: {
// 		key: fs.readFileSync("/etc/letsencrypt/live/new.beluga.fm/privkey.pem"),
// 		cert: fs.readFileSync("/etc/letsencrypt/live/new.beluga.fm/fullchain.pem")
// 	}
// })

websocket
	.register(require("fastify-ws"), {
		"library": "uws"
	})
	.after(() => {
		websocket.ws
			.on("connection", client => {							// ユーザーが接続するたびに呼ばれる
				websocket_broadcast("online", websocket.ws.clients.length)		// 全員に通知
				client.on("close", _ => {							// そのユーザーが離脱した場合に呼ばれる
					websocket_broadcast("online", websocket.ws.clients.length)	// 全員に通知
				})
			})
	})

const websocket_broadcast = (name, data) => {
	if (websocket.ws == undefined) {
		return
	}
	websocket.ws.clients.forEach(client => {
		client.send(JSON.stringify({
			[name]: data
		}))
	})
}

module.exports = websocket