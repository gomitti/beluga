import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

export default async (db, params) => {
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

	const ret = await db.collection("access_tokens").findOne({ "user_id": params.user_id })
	if (ret === null) {
		return []
	}
	return [{
		"token": ret._id,
		"secret": ret.secret
	}]
}