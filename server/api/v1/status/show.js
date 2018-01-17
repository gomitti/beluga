import { ObjectID } from "mongodb"

export default async (db, params) => {
	if (typeof params.id === "string") {
		try {
			params.id = ObjectID(params.id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}
	if (!(params.id instanceof ObjectID)) {
		throw new Error("idを指定してください")
	}
	const collection = db.collection("statuses")
	const status = await collection.findOne({ "_id": params.id })
	if (status === null) {
		return null
	}
	status.id = status._id
	for (const key in status) {
		if (key.indexOf("_") == 0) {
			delete status[key]
		}
	}
	return status
}