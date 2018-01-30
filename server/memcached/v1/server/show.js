import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"

let cache = {
	"ids": {},
	"names": {},
}

const delete_cache_by_key = key => {
	if (typeof key !== "string") {
		return
	}
	if (key in cache.ids) {
		delete cache.ids[key]
	}
}

export const delete_server_in_cache = server => {
	if (typeof server.id === "string") {
		return delete_cache_by_key(server.id)
	}
	if (server.id instanceof ObjectID) {
		return delete_cache_by_key(server.id.toHexString())
	}
}

export const delete_cache_by_name = key => {
	if (typeof key !== "string") {
		return
	}
	if (key in cache.names) {
		delete cache.names[key]
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

	if (params.id instanceof ObjectID) {
		const key = params.id.toHexString()
		if (key in cache.ids) {
			const obj = cache.ids[key];
			if (obj.expires > Date.now()) {
				obj.hit += 1
				return obj.data
			}
			delete cache.ids[key]
		}

		const server = await api.v1.server.show(db, params)
		if (server === null) {
			return null
		}

		if (Object.keys(cache.ids).length > config.memcached.capacity) {
			cache.ids = {}
		}

		cache.ids[key] = {
			"expires": Date.now() + config.memcached.max_age * 1000,
			"hit": 0,
			"data": server
		}
		return server
	}

	if (typeof params.name === "string") {
		const key = params.name
		if (key in cache.names) {
			const obj = cache.names[key];
			if (obj.expires > Date.now()) {
				obj.hit += 1
				return obj.data
			}
			delete cache.names[key]
		}

		const server = await api.v1.server.show(db, params)
		if (server === null) {
			return null
		}

		if (Object.keys(cache.names).length > config.memcached.capacity) {
			cache.names = {}
		}

		cache.names[key] = {
			"expires": Date.now() + config.memcached.max_age * 1000,
			"hit": 0,
			"data": server
		}
		return server
	}

	return null
}