import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

export default async (db, params) => {
	if (typeof params.tagname !== "string"){
		throw new Error("ハッシュタグを指定してください")
	}
	if (params.tagname.length > config.hashtag.max_tagname_length) {
		throw new Error(`ハッシュタグは${config.hashtag.max_tagname_length}文字を超えてはいけません`)
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
	if (typeof params.server_id === "string") {
		try {
			params.server_id = ObjectID(params.server_id)
		} catch (error) {
			throw new Error("サーバーを指定してください")
		}
	}
	if (!(params.server_id instanceof ObjectID)) {
		throw new Error("サーバーを指定してください")
	}

	const collection = db.collection("hashtags")

	const existing = await collection.findOne({ "tagname": params.tagname, "server_id": params.server_id })
	if (existing !== null) {
		throw new Error(`#${params.tagname}はすでに存在するため、違うハッシュタグに変更してください`)
	}

	const result = await collection.insertOne({
		"tagname": params.tagname,
		"server_id": params.server_id,
		"description": "",
		"statuses_count": 0,
		"created_at": Date.now(),
		"created_by": params.user_id
	})
	const hashtag = result.ops[0]
	hashtag.id = hashtag._id
	delete hashtag._id
	return hashtag
}