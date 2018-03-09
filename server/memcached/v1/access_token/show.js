import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"

const memcached = new Memcached(api.v1.access_token.show)

export const delete_access_token_from_cache = token => {
	if (typeof token === "string") {
		return memcached.delete(token)
	}
	if (token instanceof ObjectID) {
		return memcached.delete(token.toHexString())
	}
}

export default async (db, params) => {
	let key = params.token
	if (key instanceof ObjectID) {
		key = key.toHexString()
	}
	assert(is_string(key), "@key must be string")
	return await memcached.fetch(key, db, params)
}