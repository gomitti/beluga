import { ObjectID } from "mongodb"
import { sync as uid } from "uid-safe"
import config from "../../../config/beluga"
import assert, { is_object, is_string } from "../../../assert"

export default async (db, params) => {
	if (is_string(params.token)) {
		try {
			params.token = ObjectID(params.token)
		} catch (error) {
			throw new Error("@tokenを指定してください")
		}
	}
	if (!(params.token instanceof ObjectID)) {
		throw new Error("@tokenを指定してください")
	}
	if (is_string(params.secret) === false) {
		throw new Error("@secretを指定してください")
	}
	
	const document = await db.collection("access_tokens").findOne({ "_id": params.token })
	if(document === null){
		return document
	}

	const { secret, user_id } = document
	assert(is_string(secret), "@secret must be string")
	assert(user_id instanceof ObjectID, "@user_id must be an instance of ObjectID")

	return document
}