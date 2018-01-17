import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

export default async (db, params) => {
	if (typeof params.id === "string") {
		try {
			params.id = ObjectID(params.id)
		} catch (error) {
			throw new Error("投稿を正しく指定してください")
		}
	}
	if (!(params.id instanceof ObjectID)) {
		throw new Error("投稿を正しく指定してください")
	}

	const collection = db.collection("statuses")
	return await collection.deleteOne({ "_id": params.id })
}