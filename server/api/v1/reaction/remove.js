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

	if (typeof params.shortname !== "string") {
		throw new Error("追加するリアクションを指定してください")
	}
	if (!!params.shortname.match(/[a-zA-Z0-9_\-+]+/) === false) {
		throw new Error("追加するリアクションを指定してください")
	}

	const collection = db.collection("reactions")

	const existing = await collection.findOne({ "user_id": params.user_id, "status_id": params.status_id, "shortname": params.shortname })
	if (!existing) {
		throw new Error("すでに削除されています")
	}

	const result = await collection.deleteOne({
		"status_id": params.status_id,
		"user_id": params.user_id,
		"shortname": params.shortname
	})
	return 0
}