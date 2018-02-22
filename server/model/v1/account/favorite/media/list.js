import { ObjectID } from "mongodb"
import config from "../../../../../config/beluga"
import memcached from "../../../../../memcached"
import assert from "../../../../../assert"

export default async (db, params) => {
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}
	const media = await memcached.v1.account.favorite.media.list(db, params)
	assert("@media must be an array")
	return media
}