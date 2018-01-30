import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

export default async (db, params) => {
	if (typeof params.user_id === "string") {
		try {
			params.user_id = ObjectID(params.user_id)
		} catch (error) {
			throw new Error("ログインしてください")
		}
	}
	if (!(params.user_id instanceof ObjectID)) {
		throw new Error("ログインしてください")
	}

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
	const existing = await collection.findOne({ "status_id": params.status_id, "user_id": params.user_id })
	if (existing) {
		return true
	}
	return false
}