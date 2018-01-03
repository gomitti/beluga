import { ObjectID } from "mongodb"
import config from "../../../beluga.config"

export default async (db, params) => {
	if (typeof params.tagname !== "string"){
		throw new Error("ハッシュタグを指定してください")
	}
	if (params.tagname.length > config.hashtag.max_tagname_length) {
		throw new Error(`ハッシュタグは${config.hashtag.max_tagname_length}文字を超えてはいけません`)
	}
	if (typeof params.user_id === "string") {
		params.user_id = ObjectID(params.user_id)
	}
	if (!(params.user_id instanceof ObjectID)) {
		throw new Error("ログインしてください")
	}
	if (typeof params.server_id === "string") {
		params.server_id = ObjectID(params.server_id)
	}
	if (!(params.server_id instanceof ObjectID)) {
		throw new Error("サーバーを指定してください")
	}

	const collection = db.collection("hashtags")

	const existing = await collection.findOne({ "tagname": params.tagname, "server_id": params.server_id })
	if (existing !== null) {
		throw new Error(`#${params.name}はすでに存在するため、違うハッシュタグに変更してください`)
	}

	const result = await collection.insertOne({
		"tagname": params.tagname,
		"server_id": params.server_id,
		"description": "",
		"statuses_count": 0,
		"created_at": Date.now(),
		"created_by": params.user_id
	})
	return result.ops[0]
}