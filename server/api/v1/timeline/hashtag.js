import { ObjectID } from "mongodb"
import * as assert from "../../../assert"
import config from "../../../beluga.config"
import user_show from "../user/show"

export default async (db, params) => {
	params = Object.assign({
		"count": 20,
		"since_id": null,
		"max_id": null,
		"trim_user": true
	}, params)

	if (typeof params.id === "string") {
		params.id = ObjectID(params.id)
	}
	if (!(params.id instanceof ObjectID)) {
		throw new Error("idが不正です")
	}

	if (!!params.since_id) {
		if (typeof params.since_id === "string") {
			params.since_id = ObjectID(params.since_id)
		}
		if (!(params.since_id instanceof ObjectID)) {
			throw new Error("since_idが不正です")
		}
	} else {
		params.since_id = null
	}

	if (!!params.max_id) {
		if (typeof params.max_id === "string") {
			params.max_id = ObjectID(params.max_id)
		}
		if (!(params.max_id instanceof ObjectID)) {
			throw new Error("since_idが不正です")
		}
	} else {
		params.max_id = null
	}

	if (typeof params.count !== "number") {
		throw new Error("countが不正です")
	}
	if (params.count > config.timeline.max_count) {
		params.count = config.timeline.max_count
	}

	params.trim_user = !!params.trim_user

	let query = {
		"hashtag_id": params.id
	}
	if (params.since_id) {
		query.since_id = params.since_id
	}
	if (params.max_id) {
		query.max_id = params.max_id
	}

	const collection = db.collection("statuses")
	const result = await collection.find(query, {
		"sort": { "_id": -1 },
		"limit": params.count
	}).toArray()

	if (params.trim_user) {
		return result
	}

	const statuses = []
	for (const status of result) {
		const user = await user_show(db, { "id": status.user_id })
		if (user === null) {
			continue
		}
		status.user = user
		statuses.push(status)
	}

	return statuses
}