import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"
import show from "../../../model/v1/status/show"

export default async (db, params) => {
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}

	const status = await memcached.v1.status.show(db, { "id": params.status_id })
	if (!status) {
		throw new Error("投稿が見つかりません")
	}

	if (status.user_id.equals(user.id)) {
		throw new Error("自分の投稿にいいねすることはできません")
	}

	await api.v1.like.create(db, params)

	// 投稿を更新
	const collection = db.collection("statuses")
	const result = await collection.updateOne(
		{ "_id": status.id },
		{ "$inc": { "likes_count": 1 } }
	)

	// キャッシュの消去
	memcached.v1.delete_status_in_cache(status)

	return show(db, { "id": status.id })
}