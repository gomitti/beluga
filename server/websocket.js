import plugin from "fastify-plugin"
import cookie from "cookie"
import { sha256 } from "js-sha256"
import { ObjectID } from "mongodb"
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

const get_server_name = url => {
	const components = url.split("/")
	const location = components[1]
	if (location === config.slug.timeline.server) {
		return components[2]
	}
	if (location === "server") {
		return components[2]
	}
	return null
}

class OnlineManager {
	constructor() {
		this.users = new Set()
		this.users_on_server = {}
	}
	total() {
		return this.users.size
	}
	clear() {
		this.users.clear()
		this.users_on_server = {}
	}
	remove(url, user_id) {
		const server_name = get_server_name(url)
		if (!server_name) {
			return false
		}
		if (!(server_name in this.users_on_server)) {
			return false
		}
		const users = this.users_on_server[server_name]
		if (!(user_id in users)) {
			return false
		}
		users[user_id] -= 1
		if (users[user_id] <= 0) {
			delete users[user_id]
			return true
		}
		return false
	}
	register(url, user_id) {
		if (this.users.has(user_id) == false) {
			this.users.add(user_id)
		}
		const server_name = get_server_name(url)
		if (!server_name) {
			return
		}
		if (!(server_name in this.users_on_server)) {
			this.users_on_server[server_name] = {}
		}
		const users = this.users_on_server[server_name]
		if (!(user_id in users)) {
			users[user_id] = 0
		}
		users[user_id] += 1
	}
}

class WebsocketBridge {
	users(server) {
		if (!server.name) {
			return []
		}
		if (!(server.name in online.users_on_server)) {
			return []
		}
		const user_ids = []
		for (const user_id in online.users_on_server[server.name]) {	// 辞書なのでキーだけ取り出す
			user_ids.push(user_id)
		}
		return user_ids
	}
}

const online = new OnlineManager()

websocket
	.register(require("fastify-ws"), {
		"library": "uws"
		// "library": "ws"	// wsかuwsどちらかを選ぶ
	})
	.after(() => {
		websocket.ws
			.on("connection", async client => {		// ユーザーが接続するたびに呼ばれる
				const req = Object.assign({}, client.upgradeReq)	// なぜか消えたりするのでコピー
				const url = req.url
				const cookies = cookie.parse(req.headers.cookie)
				const session = await websocket.session.get(cookies)
				if (!!session.user_id == false) {
					return
				}
				if (!(session.user_id instanceof ObjectID)) {
					return
				}
				const user_id = session.user_id.toHexString()
				online.register(url, user_id)	// サーバーとユーザーの関連付け
				client.url = url
				client.user_id = user_id
				client.is_alive = true
				client.on("pong", function () {
					this.is_alive = true;
				})
				client.on("close", function () {
					const did_disappear = online.remove(this.url, this.user_id)	// サーバーとユーザーの関連付け
					if (did_disappear) {
						const server_name = get_server_name(this.url)
						broadcast("members_need_reload", { server_name })	// 全員に通知
					}
				})
				broadcast("online_changed", { "count": online.total() })	// 全員に通知
				const server_name = get_server_name(url)
				broadcast("members_need_reload", { server_name })	// 全員に通知
			})

		const interval = setInterval(() => {
			// pingを送信
			websocket.ws.clients.forEach(client => {
				if (client.is_alive === false) {
					return client.terminate()
				}
				client.is_alive = false;
				client.ping("", false, true);
			});

			// 全て消去
			online.clear()

			// 再追加
			websocket.ws.clients.forEach(client => {
				if (!client.user_id) {
					return
				}
				online.register(client.url, client.user_id)
			})
			broadcast("online_changed", { "count": online.total() })		// 全員に通知
		}, 30000);
	})

const broadcast = (event, data) => {
	if (websocket.ws === undefined) {
		return
	}
	websocket.ws.clients.forEach(client => {
		client.send(JSON.stringify(Object.assign({
			[event]: true
		}, data)))
	})
}

// 各サーバーのオンライン中のユーザーの管理を行う
const bridge = (fastify, options, next) => {
	fastify.decorate("online", new WebsocketBridge())
	fastify.decorate("websocket_broadcast", broadcast)
	next()
}

exports.websocket = websocket
exports.bridge = plugin(bridge)