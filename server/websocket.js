import config from "./config/beluga"
let websocket = null

if (config.https) {
	const fs = require("fs")
	websocket = require("fastify")({
		"https": {
			"key": fs.readFileSync(config.websocket.https.key),
			"cert": fs.readFileSync(config.websocket.https.cert)
		}
	})
} else {
	websocket = require("fastify")()
}

let online_users = new Set()

websocket
	.register(require("fastify-ws"), {
		"library": "uws"
	})
	.after(() => {
		websocket.ws
			.on("connection", client => {							// ユーザーが接続するたびに呼ばれる
				const ip_addr = client._socket.remoteAddress
				if (online_users.has(ip_addr) == false) {
					online_users.add(ip_addr)
				}
				client.is_alive = true
				client.onpong = function heartbeat() {
					this.is_alive = true;
				}.bind(client)
				websocket_broadcast("online", { "count": online_users.size })		// 全員に通知
			})

		const interval = setInterval(() => {
			const _users = new Set()
			websocket.ws.clients.forEach(client => {
				if (client.is_alive === false) {
					return client.terminate()
				}
				client.is_alive = false;
				client.ping("", false, true);
			});
			websocket.ws.clients.forEach(client => {
				const ip_addr = client._socket.remoteAddress
				if (_users.has(ip_addr) == false) {
					_users.add(ip_addr)
				}
			})
			websocket_broadcast("online", { "count": _users.size })		// 全員に通知
			online_users = _users
		}, 30000);
	})

const websocket_broadcast = (event, data) => {
	if (websocket.ws == undefined) {
		return
	}
	websocket.ws.clients.forEach(client => {
		client.send(JSON.stringify(Object.assign({
			[event]: true
		}, data)))
	})
}

module.exports = websocket