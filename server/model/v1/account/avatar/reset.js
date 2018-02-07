import api from "../../../../api"
import memcached from "../../../../memcached"

export default async (db, user_id, storage) => {
	const user = await memcached.v1.user.show(db, { "id": user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}
	const url = await api.v1.account.avatar.reset(db, user, storage)

	// キャッシュの消去
	memcached.v1.delete_user_from_cache(user)

	return url
}