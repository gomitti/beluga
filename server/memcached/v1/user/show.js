import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"

export let cache = {}

export default async (db, params) => {
	if (typeof params.id === "string") {
		try {
			params.id = ObjectID(params.id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}
	if (!(params.id instanceof ObjectID)) {
		throw new Error("idを指定してください")
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

	const user = await api.v1.user.show(db, params)
	if (user === null) {
		return user
	}

	if (Object.keys(cache).length > config.memcached.capacity){
		cache = {}
	}

	cache[key] = {
		"expires": Date.now() + config.memcached.max_age * 1000,
		"hit": 0,
		"data": user
	}
	return user
}