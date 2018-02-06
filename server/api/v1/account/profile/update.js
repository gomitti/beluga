import { ObjectID } from "mongodb"
import config from "../../../../config/beluga"
import logger from "../../../../logger"

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

	const query = {}

	if (typeof params.theme_color === "string") {
		if (rapams.match(/#[0-9]{6}/)) {
			query.theme_color = theme_color
		}
	}

	const collection = db.collection("users")

	const result = await collection.updateOne({"_id": params.user_id}, {
		"$set": query
	})
	return true
}