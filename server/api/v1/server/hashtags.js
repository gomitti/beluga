import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

export default async (db, params) => {
	params = Object.assign({
		"threshold": config.server.hashtags.min_count_to_display
	}, params)

	if (typeof params.id === "string") {
		try {
			params.id = ObjectID(params.id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}
	if (!(params.id instanceof ObjectID)) {
		throw new Error("idが不正です")
	}

	if (typeof params.threshold !== "number") {
		throw new Error("thresholdが不正です")
	}

	const collection = db.collection("hashtags")
	const rows = await collection.find({
		"server_id": params.id,
		"statuses_count": { "$gt": params.threshold }
	}).sort({ "statuses_count": -1 }).toArray()

	for(const hashtag of rows){
		hashtag.id = hashtag._id
		for (const key in hashtag) {
			if (key.indexOf("_") == 0) {
				delete hashtag[key]
			}
		}
	}
	return rows
}