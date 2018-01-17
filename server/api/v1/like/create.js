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

	if (typeof params.id === "string") {
		try {
			params.id = ObjectID(params.id)
		} catch (error) {
			throw new Error("投稿が見つかりません")
		}
	}
	if (!(params.id instanceof ObjectID)) {
		throw new Error("投稿が見つかりません")
	}

	const collection = db.collection("likes")

	const existing = await collection.findOne({ "user_id": params.user_id, "status_id": params.id })
	if (existing) {
		if (existing.count >= config.like.max_count) {
			throw new Error("これ以上いいねを付けることはできません")
		}
		const count = existing.count + 1
		const result = await collection.updateOne(
			{ "status_id": params.id, "user_id": params.user_id },
			{ "$set": { "count": count } })
		return count
	}

	const count = 1
	const result = await collection.insertOne({
		"status_id": params.id,
		"user_id": params.user_id,
		count
	})
	return count
}