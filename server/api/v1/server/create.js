import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

export default async (db, params) => {
	if (typeof params.name !== "string") {
		throw new Error("サーバー名を入力してください")
	}
	if (params.name.length == 0) {
		throw new Error("サーバー名を入力してください")
	}
	if (params.name.length > config.server.max_name_length) {
		throw new Error(`サーバー名は${config.server.max_name_length}文字を超えてはいけません`)
	}
	if (params.name.match(config.server.name_regexp) === null) {
		throw new Error("サーバー名に使用できない文字が含まれています")
	}

	if (typeof params.display_name !== "string") {
		throw new Error("表示名を入力してください")
	}
	if (params.display_name.length == 0) {
		throw new Error("表示名を入力してください")
	}
	if (params.display_name.length > config.server.max_display_name_length) {
		throw new Error(`表示名は${config.server.max_display_name_length}文字を超えてはいけません`)
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

	const collection = db.collection("servers")

	const existing = await collection.findOne({ "name": params.name })
	if (existing !== null) {
		throw new Error(`${params.name}はすでに存在するため、違うサーバー名に変更してください`)
	}

	const multipost = await collection.findOne({ "created_by": params.user_id })
	if (multipost !== null) {
		// throw new Error("サーバーを複数作成することはできません")
	}

	const result = await collection.insertOne({
		"name": params.name,
		"display_name": params.display_name,
		"description": "",
		"statuses_count": 0,
		"created_at": Date.now(),
		"created_by": params.user_id
	})
	const server = result.ops[0]
	server.id = server._id
	delete server._id
	return server
}