import { ObjectID } from "mongodb"
import config from "../../../../../config/beluga"
import model from "../../../../../model"

export default async (db, params) => {
	const rows = await model.v1.account.bookmark.media.list(db, params)
	if (!(rows instanceof Array)) {
		throw new Error("account.bookmark.media.list must return array")
	}

	const list = []
	for (const media_id of rows) {
		const media = await model.v1.media.show(db, { "id": media_id })
		if(media){
			list.push(media)
		}
	}
	return list
}