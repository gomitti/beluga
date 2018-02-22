import api from "../../../../../api"
import memcached from "../../../../../memcached"

export default async (db, params) => {
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}
	if (!(params.shortnames instanceof Array)) {
		throw new Error("絵文字を指定してください")
	}
	
	await api.v1.account.favorite.emoji.update(db, { "user_id": user.id, "shortnames": params.shortnames })
	memcached.v1.delete_account_bookmark_emoji_from_cache(user)

	return true
}