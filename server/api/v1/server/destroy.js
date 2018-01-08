import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

export default async (db, params) => {
	if (typeof params.server_id === "string") {
		try {
			params.server_id = ObjectID(params.server_id)
		} catch (error) {
			throw new Error("サーバーを指定してください")
		}
	}
	if (!(params.server_id instanceof ObjectID)) {
		throw new Error("サーバーを指定してください")
	}

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

	const collection = db.collection("servers")
	return await collection.deleteOne({ "_id": params.server_id, "created_by": params.user_id })
}