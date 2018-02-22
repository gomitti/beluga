import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert from "../../../assert"

const memcached = new Memcached(api.v1.server.hashtags, 600)

export const delete_server_hashtags_from_cache = server => {
	if (typeof server.id === "string") {
		return memcached.delete(server.id)
	}
	if (server.id instanceof ObjectID) {
		return memcached.delete(server.id.toHexString())
	}
}

export default async (db, params) => {
	let primary_key = params.id
	if (primary_key instanceof ObjectID) {
		primary_key = primary_key.toHexString()
	}
	assert(typeof primary_key === "string", "@primary_key must be string")
	const threshold = params.threshold
	assert(typeof threshold === "number", "@threshold must be number")
	return await memcached.fetch([primary_key, threshold], db, params)
}