import api from "../../../../api"
import memcached from "../../../../memcached"

export default async (db, params, storage) => {
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}
	const url = await api.v1.account.avatar.update(db, params.data, user, storage)

	// キャッシュの消去
	memcached.v1.delete_user_from_cache(user)
	
	return url
}