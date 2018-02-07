import { ObjectID } from "mongodb"
import config from "../../../../config/beluga"

export default async (db, params) => {
	params = Object.assign({
		"count": config.media.list.count.default
	}, params)

	if (!!params.user_id == false) {
		throw new Error("user_idを指定してください")
	}
	let query = null
	if (typeof params.user_id === "string") {
		try {
			params.user_id = ObjectID(params.user_id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}
	if (!(params.user_id instanceof ObjectID)) {
		throw new Error("idが不正です")
	}

	const collection = db.collection("media")
	return await collection.find({ "user_id": params.user_id }).sort({ "created_at": -1 }).limit(params.count).toArray()
}