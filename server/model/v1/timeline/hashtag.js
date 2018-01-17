import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"
import show from "../status/show"

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

	const hashtag = await memcached.v1.hashtag.show(db, { "id": params.id })
	if (!hashtag) {
		throw new Error("ルームが存在しません")
	}

	const rows = await api.v1.timeline.hashtag(db, params)
	const statuses = []
	for (const row of rows) {
		const status = await show(db, Object.assign({}, params, { "id": row.id }))
		statuses.push(status)
	}
	return statuses
}