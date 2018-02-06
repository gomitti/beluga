import { ObjectID } from "mongodb"
import config from "../../config/beluga"
import api from "../../api"
import model from "../../model"
import collection from "../../collection"

export default async (db, params) => {
	params = Object.assign({}, api.v1.timeline.default_params, params)

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

	const server = await model.v1.server.show(db, { "id": params.server_id })
	if (!server) {
		throw new Error("サーバーが存在しません")
	}

	const rows = await api.v1.timeline.server(db, params)
	const statuses = []
	for (const row of rows) {
		const status = await collection.v1.status.show(db, Object.assign({}, params, { "id": row.id }))
		statuses.push(status)
	}
	return statuses
}