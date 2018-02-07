import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"
import model from "../../../model"

export default async (db, params) => {
	const rows = await api.v1.media.list(db, params)
	if (!(rows instanceof Array)) {
		throw new Error("api.v1.media.list must return an array")
	}

	const list = []
	for (const row of rows) {
		const media = await model.v1.media.show(db, { "id": row.id })
		if (media) {
			list.push(media)
		}
	}
	return list
}