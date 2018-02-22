import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"
import model from "../../../model"
import assert from "../../../assert"

export default async (db, params) => {
	const rows = await api.v1.media.list(db, params)
	assert(rows instanceof Array, "@rows must be an array")

	const list = []
	for (const row of rows) {
		const media = await model.v1.media.show(db, { "id": row.id })
		if (media) {
			list.push(media)
		}
	}
	return list
}