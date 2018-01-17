import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"
import show from "../status/show"

export default async (db, params) => {
	params = Object.assign({}, api.v1.timeline.default_params, params)

	if (typeof params.user_id === "string") {
		try {
			params.user_id = ObjectID(params.user_id)
		} catch (error) {
			throw new Error("user_idが不正です")
		}
	}
	if (!(params.user_id instanceof ObjectID)) {
		throw new Error("user_idが不正です")
	}
	
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if(!user){
		throw new Error("ユーザーが存在しません")
	}

	if (typeof params.server_id === "string") {
		try {
			params.server_id = ObjectID(params.server_id)
		} catch (error) {
			throw new Error("server_idが不正です")
		}
	}
	if (!(params.server_id instanceof ObjectID)) {
		throw new Error("server_idが不正です")
	}

	const server = await memcached.v1.server.show(db, { "id": params.server_id })
	if (!server) {
		throw new Error("サーバーが存在しません")
	}

	const rows = await api.v1.timeline.home(db, params)
	const statuses = []
	for (const row of rows) {
		const status = await show(db, Object.assign({}, params, { "id": row.id }))
		statuses.push(status)
	}
	return statuses
}