import { ObjectID } from "mongodb"
import config from "../../../beluga.config"

export default async (db, params) => {
	if (typeof params.id === "string") {
		try {
			params.id = ObjectID(params.id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}

	let query = null

	if (params.id instanceof ObjectID) {
		query = {
			"_id": params.id
		}
	} else {
		if (typeof params.tagname !== "string") {
			throw new Error("tagnameが不正です")
		}
		if (params.tagname.length == 0) {
			throw new Error("tagnameを指定してください")
		}
		if (params.tagname.length > config.hashtag.max_tagname_length) {
			throw new Error(`tagnameは${config.hashtag.max_tagname_length}文字を超えてはいけません`)
		}

		if (typeof params.server_id === "string") {
			try {
				params.server_id = ObjectID(params.server_id)
			} catch (error) {
				throw new Error("server_idが不正です")
			}
		}
		if (!(params.server_id instanceof ObjectID)) {
			throw new Error("server_idが不正です")
		}
		
		query = {
			"tagname": params.tagname,
			"server_id": params.server_id,
		}
	}

	const collection = db.collection("hashtags")
	const hashtag = await collection.findOne(query)
	if (hashtag === null) {
		return null
	}
	hashtag.id = hashtag._id
	for (const key in hashtag) {
		if (key.indexOf("_") == 0) {
			delete hashtag[key]
		}
	}
	return hashtag
}