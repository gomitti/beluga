import { ObjectID } from "mongodb"
import { sync as uid } from "uid-safe"
import config from "../../../config/beluga"
import assert, { is_object } from "../../../assert"

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
	const secret = uid(64)
	const collection = db.collection("access_tokens")

	let deleted_token = null
	const existing = await collection.findOne({ "user_id": params.user_id })
	if (existing !== null) {
		deleted_token = existing._id
		await collection.deleteOne({ "_id": existing._id })
	}

	const result = await collection.insertOne({
		secret, "user_id": params.user_id
	})
	const document = result.ops[0]
	assert(is_object(document), "@document must be object")
	const token = document._id
	assert(token instanceof ObjectID, "@token must be an instance of ObjectID")
	
	return { "token": token.toHexString(), secret, deleted_token }
}