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
	if (!(params.user_id instanceof ObjectID)) {
		throw new Error("user_idを指定してください")
	}
	
	if (typeof params.status_id === "string") {
		try {
			params.status_id = ObjectID(params.status_id)
		} catch (error) {
			throw new Error("status_idが不正です")
		}
	}
	if (!(params.status_id instanceof ObjectID)) {
		throw new Error("status_idを指定してください")
	}

	const primary_key = params.status_id.toHexString()
	const secondary_key = params.user_id.toHexString()
	if (primary_key in cache) {
		const users = cache[primary_key]
		if(typeof users === "object"){
			if (secondary_key in users){
				const obj = users[secondary_key]
				if (obj.expires > Date.now()) {
					obj.hit += 1
					return obj.data
				}
				delete cache[primary_key]
			}
		}
	} else {
		cache[primary_key] = {}
	}

	const favorited = await api.v1.favorite.favorited(db, params)

	if (Object.keys(cache).length > config.memcached.capacity) {
		cache = {}
	}

	cache[primary_key][secondary_key] = {
		"expires": Date.now() + config.memcached.max_age * 1000,
		"hit": 0,
		"data": favorited
	}

	return favorited
}