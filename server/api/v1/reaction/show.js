import { ObjectID } from "mongodb"

export default async (db, params) => {
	if (typeof params.status_id === "string") {
		try {
			params.status_id = ObjectID(params.status_id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}
	if (!(params.status_id instanceof ObjectID)) {
		throw new Error("idを指定してください")
	}
	const collection = db.collection("reactions")
	const rows = await collection.find({ "status_id": params.status_id }).toArray()
	if (rows === null) {
		return []
	}
	const result = {}
	for (const row of rows) {
		const { shortname } = row
		if (!(shortname in result)){
			result[shortname] = 1
			continue
		}
		result[shortname] += 1
	}
	return result
}