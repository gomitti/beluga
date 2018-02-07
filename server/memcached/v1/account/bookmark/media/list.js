import { ObjectID } from "mongodb"
import api from "../../../../../api"
import { Memcached } from "../../../../../memcached/v1/memcached"

const memcached = new Memcached(api.v1.account.bookmark.media.list)

export const delete_account_bookmark_media_from_cache = user => {
	if (typeof user.id === "string") {
		return memcached.delete(user.id)
	}
	if (user.id instanceof ObjectID) {
		return memcached.delete(user.id.toHexString())
	}
}

export default async (db, params) => {
	let key = params.user_id
	if (key instanceof ObjectID) {
		key = key.toHexString()
	}
	if (typeof key === "string") {
		return await memcached.fetch(key, db, params)
	}
	return null
}