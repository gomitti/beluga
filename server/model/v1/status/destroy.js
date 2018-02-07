import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"

export default async (db, params) => {
	const status = await memcached.v1.status.show(db, { "id": params.id })
	if (!status) {
		throw new Error("投稿が見つかりません")
	}

	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}

	if (status.user_id.equals(user.id) === false) {
		throw new Error("権限がありません")
	}

	await api.v1.status.destroy(db, params)

	// キャッシュの消去
	memcached.v1.delete_status_from_cache(status)
	
	return true
}