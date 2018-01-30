import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

export default async (db, params) => {
	params = Object.assign({
		"from_mobile": false
	}, params)

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

	if (typeof params.ip_address !== "string") {
		throw new Error("サーバーで問題が発生しました")
	}

	if (typeof params.from_mobile !== "boolean") {
		throw new Error("サーバーで問題が発生しました")
	}

	const query = {
		"text": params.text,
		"user_id": params.user_id,
		"likes_count": 0,
		"favorites_count": 0,
		"created_at": Date.now(),
		"from_mobile": params.from_mobile,
		"_ip_address": params.ip_address
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

	// サーバーの全投稿を表示するTLのためにサーバーIDも記録する
	if (typeof params.server_id === "string") {
		try {
			params.server_id = ObjectID(params.server_id)
		} catch (error) {
			params.server_id = null
		}
	}
	if (params.server_id instanceof ObjectID) {
		query.server_id = params.server_id
	}

	if (query.recipient_id && query.hashtag_id) {
		throw new Error("投稿先が重複しています")
	}
	if (!query.recipient_id && !query.hashtag_id) {
		throw new Error("投稿先を指定してください")
	}

	const collection = db.collection("statuses")

	// 最初の投稿は本人以外にできないようにする
	if (query.recipient_id) {
		const status = await collection.findOne({
			"recipient_id": params.recipient_id,
			"server_id": params.server_id
		})
		if (status === null) {
			if (params.user_id.equals(params.recipient_id) === false) {
				throw new Error("最初の投稿は本人以外にはできません")
			}
		}
	}


	const result = await collection.insertOne(query)
	const status = result.ops[0]
	status.id = status._id
	for (const key in status) {
		if (key.indexOf("_") == 0) {
			delete status[key]
		}
	}
	return status
}