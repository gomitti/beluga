import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert from "../../../assert"

const memcached = {
	"ids": new Memcached(api.v1.hashtag.show),
	"tagnames": new Memcached(api.v1.hashtag.show),
}

export const delete_hashtag_from_cache = hashtag => {
	if (typeof hashtag.id === "string") {
		return memcached.ids.delete(hashtag.id)
	}
	if (hashtag.id instanceof ObjectID) {
		return memcached.ids.delete(hashtag.id.toHexString())
	}
	if (typeof hashtag.tagname === "string") {
		return memcached.tagnames.delete(hashtag.tagname)
	}
}

export default async (db, params) => {
	let key = params.id
	if (key instanceof ObjectID) {
		key = key.toHexString()
	}
	if (typeof key === "string") {
		return await memcached.ids.fetch(key, db, params)
	}
	
	let server_id = params.server_id
	if (server_id instanceof ObjectID) {
		server_id = server_id.toHexString()
	}
	if (typeof params.tagname === "string" && typeof server_id === "string") {
		return await memcached.tagnames.fetch([server_id, params.tagname], db, params)
	}
	assert(false, "Invalid key")
}