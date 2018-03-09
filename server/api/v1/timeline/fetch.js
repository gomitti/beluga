import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

export default async (db, query, params) => {	
	if (params.since_id) {
		if (typeof params.since_id === "string") {
			try {
				params.since_id = ObjectID(params.since_id)
			} catch (error) {
				throw new Error("since_idが不正です")
			}
		}
		if (!(params.since_id instanceof ObjectID)) {
			throw new Error("since_idが不正です")
		}
	} else {
		params.since_id = null
	}

	if (params.max_id) {
		if (typeof params.max_id === "string") {
			try {
				params.max_id = ObjectID(params.max_id)
			} catch (error) {
				throw new Error("max_idが不正です")
			}
		}
		if (!(params.max_id instanceof ObjectID)) {
			throw new Error("max_idが不正です")
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

	if (typeof params.sort !== "number") {
		throw new Error("sortが不正です")
	}
	if (params.sort !== 1 && params.sort !== -1) {
		throw new Error("sortが不正です")
	}

	if (params.since_id) {
		query._id = { "$gt": params.since_id }
	}
	if (params.max_id) {
		query._id = { "$lt": params.max_id }
	}

	const collection = db.collection("statuses")
	const rows = await collection.find(query).sort({ "_id": -1 }).limit(params.count).toArray()

	for (const status of rows) {
		status.id = status._id
		for (const key in status) {
			if (key.indexOf("_") == 0) {
				delete status[key]
			}
		}
	}
	return rows
}