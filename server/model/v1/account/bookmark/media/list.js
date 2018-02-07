import { ObjectID } from "mongodb"
import config from "../../../../../config/beluga"
import memcached from "../../../../../memcached"

export default async (db, params) => {
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}
	const media = await memcached.v1.account.bookmark.media.list(db, params)
	if(!(media instanceof Array)){
		throw new Error("media must be a instance of Array")
	}
	return media
}