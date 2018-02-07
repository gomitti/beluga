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
	const collection = db.collection("media")
	const media = await collection.findOne({ "_id": params.id })
	if (media === null) {
		return null
	}
	media.id = media._id
	for (const key in media) {
		if (key.indexOf("_") == 0) {
			delete media[key]
		}
	}
	return media
}