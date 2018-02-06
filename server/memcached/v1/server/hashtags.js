import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"

const memcached = new Memcached(api.v1.server.hashtags)

export const delete_server_hashtags_in_cache = server => {
	if (typeof server.id === "string") {
		return memcached.delete(server.id)
	}
	if (server.id instanceof ObjectID) {
		return memcached.delete(server.id.toHexString())
	}
}

export default async (db, params) => {
	let key = params.id
	if (key instanceof ObjectID) {
		key = key.toHexString()
	}
	if (typeof key === "string") {
		return await memcached.fetch(key, db, params)
	}
	return null
}