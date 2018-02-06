import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"

const memcached = {
	"ids": new Memcached(api.v1.hashtag.show),
	"tagnames": new Memcached(api.v1.hashtag.show),
}

export const delete_hashtag_in_cache = hashtag => {
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
	if (typeof params.tagname === "string") {
		return await memcached.tagnames.fetch(params.tagname, db, params)
	}
	return null
}