import { ObjectID } from "mongodb"
import config from "../../../beluga.config"

export default async (db, params) => {
	if (typeof params.server_id === "string") {
		params.server_id = ObjectID(params.server_id)
	}
	if (!(params.server_id instanceof ObjectID)) {
		throw new Error("サーバーを指定してください")
	}

	if (typeof params.user_id === "string") {
		params.user_id = ObjectID(params.user_id)
	}
	if (!(params.user_id instanceof ObjectID)) {
		throw new Error("ログインしてください")
	}

	const collection = db.collection("servers")
	return await collection.deleteOne({ "_id": params.server_id, "created_by": params.user_id })
}