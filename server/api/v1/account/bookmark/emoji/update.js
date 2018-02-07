import { ObjectID } from "mongodb"
import config from "../../../../../config/beluga"
import logger from "../../../../../logger"

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

	if (!(params.emojis instanceof Array)) {
		throw new Error("絵文字を指定してください")
	}
	const emojis = []
	for (const shortname of params.emojis) {
		if (shortname.match(/^[a-zA-Z0-9_\-+]+$/)) {
			emojis.push(shortname)
		}
	}

	const collection = db.collection("bookmarks")
	const result = await collection.updateOne({ "user_id": params.user_id }, {
		"$set": { emojis }
	})
	return true
}