import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert from "../../../assert"

const memcached = new Memcached(api.v1.reaction.show)

export const delete_status_reaction_from_cache = status => {
	if (typeof status.id === "string") {
		return memcached.delete(status.id)
	}
	if (status.id instanceof ObjectID) {
		return memcached.delete(status.id.toHexString())
	}
}

export default async (db, params) => {
	let key = params.status_id
	if (key instanceof ObjectID) {
		key = key.toHexString()
	}
	assert(typeof key === "string", "@key must be string")
	return await memcached.fetch(key, db, params)
}