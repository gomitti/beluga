import { ObjectID } from "mongodb"
import config from "../../../../../config/beluga"
import logger from "../../../../../logger"
import assert from "../../../../../assert"

export default async (db, params) => {
	if (typeof params.user_id === "string") {
		try {
			params.user_id = ObjectID(params.user_id)
		} catch (error) {
			throw new Error("ログインしてください")
		}
	}
	assert(params.user_id instanceof ObjectID, "ログインしてください")
	assert(params.shortnames instanceof Array, "絵文字を指定してください")

	const emoji_shortnames = []
	for (const shortname of params.shortnames) {
		try {
			assert(shortname.match(/^[a-zA-Z0-9_\-+]+$/), "不正な絵文字です")
			if (emoji_shortnames.includes(shortname)) {
				continue
			}
			emoji_shortnames.push(shortname)
		} catch (error) {

		}
	}

	const collection = db.collection("bookmarks")
	const result = await collection.updateOne({ "user_id": params.user_id }, {
		"$set": { emoji_shortnames }
	}, { "upsert": true })

	return true
}