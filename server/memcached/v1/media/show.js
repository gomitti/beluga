import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"

const memcached = new Memcached(api.v1.media.show)

export const delete_media_from_cache = media => {
	if (typeof media.id === "string") {
		return memcached.delete(media.id)
	}
	if (media.id instanceof ObjectID) {
		return memcached.delete(media.id.toHexString())
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