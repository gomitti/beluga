import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"

export default async (db, params) => {
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}

	const status = await memcached.v1.status.show(db, { "id": params.status_id })
	if (!status) {
		throw new Error("投稿が見つかりません")
	}

	await api.v1.favorite.destroy(db, params)

	// 投稿を更新
	const favorites = db.collection("favorites")
	const count = await favorites.find({ "status_id": status.id }).count()
	const collection = db.collection("statuses")
	const result = await collection.updateOne(
		{ "_id": status.id },
		{ "$set": { "favorites_count": count } }
	)

	// キャッシュの消去
	memcached.v1.delete_status_from_cache(status)
	memcached.v1.delete_status_favorited_by_from_cache(status)

	return true
}