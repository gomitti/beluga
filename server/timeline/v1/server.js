import { ObjectID } from "mongodb"
import config from "../../config/beluga"
import api from "../../api"
import model from "../../model"
import memcached from "../../memcached"
import collection from "../../collection"

export default async (db, params) => {
	params = Object.assign({}, api.v1.timeline.default_params, params)

	if (typeof params.id === "string") {
		try {
			params.id = ObjectID(params.id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}
	if (!(params.id instanceof ObjectID)) {
		throw new Error("idが不正です")
	}

	const server = await model.v1.server.show(db, { "id": params.id })
	if (!server) {
		throw new Error("サーバーが存在しません")
	}

	const rows = await memcached.v1.timeline.server(db, params)
	const statuses = []
	for (const row of rows) {
		params.id = row.id
		const status = await collection.v1.status.show(db, params)
		if (status) {
			statuses.push(status)
		}
	}
	return statuses
}