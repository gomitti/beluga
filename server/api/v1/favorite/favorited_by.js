import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

export default async (db, params) => {
	if (typeof params.status_id === "string") {
		try {
			params.status_id = ObjectID(params.status_id)
		} catch (error) {
			throw new Error("投稿が見つかりません")
		}
	}
	if (!(params.status_id instanceof ObjectID)) {
		throw new Error("投稿が見つかりません")
	}

	const collection = db.collection("favorites")
	const rows = await collection.find({ "status_id": params.status_id }).sort({ "created_at": -1 }).toArray()
	const user_ids = []
	for (const row of rows) {
		user_ids.push(row.user_id)
	}
	return user_ids
}