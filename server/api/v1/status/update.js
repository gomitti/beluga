import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

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
		try {
			params.user_id = ObjectID(params.user_id)
		} catch (error) {
			throw new Error("ログインしてください")
		}
	}
	if (!(params.user_id instanceof ObjectID)) {
		throw new Error("ログインしてください")
	}

	const query = {
		"text": params.text,
		"user_id": params.user_id,
		"likes_count": 0,
		"favorites_count": 0,
		"created_at": Date.now()
	}

	// ルームへの投稿
	if (typeof params.hashtag_id === "string") {
		try {
			params.hashtag_id = ObjectID(params.hashtag_id)
		} catch (error) {
			params.hashtag_id = null
		}
	}
	if (params.hashtag_id instanceof ObjectID) {
		query.hashtag_id = params.hashtag_id
	}
	
	// ユーザーのホームへの投稿
	if (typeof params.recipient_id === "string") {
		try {
			params.recipient_id = ObjectID(params.recipient_id)
		} catch (error) {
			params.recipient_id = null
		}
	}
	if (params.recipient_id instanceof ObjectID) {
		query.recipient_id = params.recipient_id
	}

	if (!!query.recipient_id && !!query.hashtag_id) {
		throw new Error("投稿先が重複しています")
	}
	if (!query.recipient_id && !query.hashtag_id) {
		throw new Error("投稿先を指定してください")
	}

	const collection = db.collection("statuses")
	const result = await collection.insertOne(query)
	const status = result.ops[0]
	status.id = status._id
	delete status._id
	return status
}