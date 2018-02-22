import { ObjectID } from "mongodb"
import config from "../../../../../config/beluga"
import model from "../../../../../model"
import assert from "../../../../../assert"

export default async (db, params) => {
	const rows = await model.v1.account.favorite.media.list(db, params)
	assert(rows instanceof Array, "@rows must be an array")

	const list = []
	for (const media_id of rows) {
		const media = await model.v1.media.show(db, { "id": media_id })
		if(media){
			list.push(media)
		}
	}
	return list
}