import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"

let cache = {}

const delete_cache_by_key = key => {
	if (typeof key !== "string") {
		return
	}
	if (key in cache) {
		delete cache[key]
	}
}

export const delete_server_hashtags_in_cache = server => {
	if (typeof server.id === "string") {
		return delete_cache_by_key(server.id)
	}
	if (server.id instanceof ObjectID) {
		return delete_cache_by_key(server.id.toHexString())
	}
}

export default async (db, params) => {
	if (typeof params.id === "string") {
		try {
			params.id = ObjectID(params.id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}

	const key = params.id.toHexString()
	if (key in cache) {
		const obj = cache[key];
		if (obj.expires > Date.now()) {
			obj.hit += 1
			return obj.data
		}
		delete cache[key]
	}

	const hashtags = await api.v1.server.hashtags(db, params)

	if (Object.keys(cache).length > config.memcached.capacity) {
		cache = {}
	}

	cache[key] = {
		"expires": Date.now() + config.memcached.max_age * 1000,
		"hit": 0,
		"data": hashtags
	}
	return hashtags
}