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
	assert(params.media_ids instanceof Array, "メディアを指定してください")

	const media_ids = []
	for (const id_str of params.media_ids) {
		try {
			media_ids.push(ObjectID(id_str))
		} catch (error) {

		}
	}

	const collection = db.collection("bookmarks")
	const result = await collection.updateOne({ "user_id": params.user_id }, {
		"$set": { media_ids }
	}, { "upsert": true })

	return true
}