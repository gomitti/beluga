import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert from "../../../assert"

const memcached = {
	"ids": new Memcached(api.v1.server.show),
	"names": new Memcached(api.v1.server.show),
}

export const delete_user_from_cache = user => {
	if (typeof user.id === "string") {
		return memcached.ids.delete(user.id)
	}
	if (user.id instanceof ObjectID) {
		return memcached.ids.delete(user.id.toHexString())
	}
	if (typeof user.name === "string") {
		return memcached.names.delete(user.name)
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
	if (typeof params.name === "string") {
		return await memcached.names.fetch(params.name, db, params)
	}
	assert(false, "Invalid key")
}