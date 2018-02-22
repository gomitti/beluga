import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert from "../../../assert"

const memcached = new Memcached(api.v1.favorite.favorited)

export const delete_status_favorited_from_cache = status => {
	if (typeof status.id === "string") {
		return delete_cache_by_key(status.id)
	}
	if (status.id instanceof ObjectID) {
		return delete_cache_by_key(status.id.toHexString())
	}
}

export default async (db, params) => {
	if (typeof params.user_id === "string") {
		try {
			params.user_id = ObjectID(params.user_id)
		} catch (error) {
			throw new Error("user_idが不正です")
		}
	}
	assert(params.user_id instanceof ObjectID, "ログインしてください")
	
	if (typeof params.status_id === "string") {
		try {
			params.status_id = ObjectID(params.status_id)
		} catch (error) {
			throw new Error("status_idが不正です")
		}
	}
	assert(params.status_id instanceof ObjectID, "投稿が見つかりません")

	const primary_key = params.status_id.toHexString()
	const secondary_key = params.user_id.toHexString()

	return await memcached.fetch([primary_key, secondary_key], db, params)
}