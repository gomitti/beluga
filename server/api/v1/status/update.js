import { ObjectID } from "mongodb"
import * as assert from "../../../assert"
import config from "../../../beluga.config"

export default async (db, params) => {
	if (typeof params.text !== "string") {
		throw new Error("本文を入力してください")
	}
	if (params.text.length == 0) {
		throw new Error("本文を入力してください")
	}
	if (params.text.length > config.status.max_text_length) {
		throw new Error(`本文は${config.status.max_text_length}文字以内で入力してください`)
	}

	if (typeof params.user_id === "string") {
		params.user_id = ObjectID(params.user_id)
	}
	if (!(params.user_id instanceof ObjectID)) {
		throw new Error("ログインしてください")
	}

	const query = {
		"text": params.text,
		"user_id": params.user_id,
		"likes_count": 0,
		"created_at": Date.now()
	}

	if (typeof params.hashtag_id === "string") {
		params.hashtag_id = ObjectID(params.hashtag_id)
	}
	if (params.hashtag_id instanceof ObjectID) {
		query.hashtag_id = params.hashtag_id
	}

	const collection = db.collection("statuses")
	const result = await collection.insertOne(query)
	return result.ops[0]
}