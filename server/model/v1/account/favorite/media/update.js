import api from "../../../../../api"
import memcached from "../../../../../memcached"

export default async (db, params) => {
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}

	if (!(params.media_ids instanceof Array)) {
		throw new Error("画像を指定してください")
	}

	const media_ids = []
	for (const id_str of params.media_ids) {
		const media = await memcached.v1.media.show(db, { "id": id_str })
		if (media) {
			media_ids.push(media.id)
		}
	}
	await api.v1.account.favorite.media.update(db, { "user_id": user.id, media_ids })

	memcached.v1.delete_account_bookmark_media_from_cache(user)
	
	return true
}