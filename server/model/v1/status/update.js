import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"
import show from "./show"

export default async (db, params) => {
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}

	let hashtag = null
	if (params.hashtag_id) {
		hashtag = await memcached.v1.hashtag.show(db, { "id": params.hashtag_id })
		if (!hashtag) {
			throw new Error("ルームがが見つかりません")
		}
		params.server_id = hashtag.server_id
	}

	if (params.recipient_id) {
		const recipient = await memcached.v1.user.show(db, { "id": params.recipient_id })
		if (!recipient) {
			throw new Error("ユーザーが見つかりません")
		}
	}

	const status = await api.v1.status.update(db, params)

	if(hashtag){
		const collection = db.collection("hashtags")
		const result = await collection.updateOne(
			{ "_id": hashtag.id },
			{ "$inc": { "statuses_count": 1 } }
		)
		hashtag.statuses_count += 1		// キャッシュを直接変更
	}

	return await show(db, { "id": status.id })
}