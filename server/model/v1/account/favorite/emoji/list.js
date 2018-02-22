import { ObjectID } from "mongodb"
import config from "../../../../../config/beluga"
import memcached from "../../../../../memcached"
import assert from "../../../../../assert"

export default async (db, params) => {
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}
	const shortnames = await memcached.v1.account.favorite.emoji.list(db, params)
	assert(shortnames instanceof Array, "@shortnames must be an array")
	return shortnames
}