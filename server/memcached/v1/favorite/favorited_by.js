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

export const delete_status_favorited_by_in_cache = status => {
	if (typeof status.id === "string") {
		return delete_cache_by_key(status.id)
	}
	if (status.id instanceof ObjectID) {
		return delete_cache_by_key(status.id.toHexString())
	}
}

export default async (db, params) => {
	if (typeof params.status_id === "string") {
		try {
			params.status_id = ObjectID(params.status_id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}
	if (!(params.status_id instanceof ObjectID)) {
		throw new Error("idを指定してください")
	}

	const key = params.status_id.toHexString()
	if (key in cache) {
		const obj = cache[key];
		if (obj.expires > Date.now()) {
			obj.hit += 1
			return obj.data
		}
		delete cache[key]
	}

	const users = await api.v1.favorite.favorited_by(db, params)

	if (Object.keys(cache).length > config.memcached.capacity) {
		cache = {}
	}

	cache[key] = {
		"expires": Date.now() + config.memcached.max_age * 1000,
		"hit": 0,
		"data": users
	}
	return users
}