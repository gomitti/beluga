import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"

const memcached = new Memcached(api.v1.favorite.favorited_by)

export const delete_status_favorited_by_from_cache = status => {
	if (typeof status.id === "string") {
		return memcached.delete(status.id)
	}
	if (status.id instanceof ObjectID) {
		return memcached.delete(status.id.toHexString())
	}
}

export default async (db, params) => {
	let key = params.status_id
	if (key instanceof ObjectID) {
		key = key.toHexString()
	}
	if (typeof key === "string") {
		return await memcached.fetch(key, db, params)
	}
	return null
}