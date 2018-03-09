import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"

export default async (db, params) => {
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}

	const { token, secret, deleted_token } = await api.v1.access_token.generate(db, params)
	if (deleted_token){
		memcached.v1.delete_access_token_from_cache(deleted_token)
	}
	memcached.v1.delete_access_token_list_from_cache(user)
	return { token, secret }
}