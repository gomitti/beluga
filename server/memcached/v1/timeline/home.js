import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string, is_number, is_object } from "../../../assert"

const fetch = api.v1.timeline.home

// since_id指定時と分ける
const memcached_diff = new Memcached(fetch)
const memcached_whole = new Memcached(fetch)

export const delete_timeline_home_from_cache = (recipient, server) => {
	assert(is_object(recipient), "@recipient must be object")
	assert(is_object(server), "@server must be object")

	let server_id = server.id
	if (server_id instanceof ObjectID) {
		server_id = server_id.toHexString()
	}
	assert(is_string(server_id), "@server_id must be string")

	let user_id = recipient.id
	if (user_id instanceof ObjectID) {
		user_id = user_id.toHexString()
	}
	assert(is_string(user_id), "@user_id must be string")

	memcached_diff.delete([server_id, user_id])
	memcached_whole.delete([server_id, user_id])
}

export default async (db, params) => {
	let user_id = params.user_id
	if (user_id instanceof ObjectID) {
		user_id = user_id.toHexString()
	}
	let server_id = params.server_id
	if (server_id instanceof ObjectID) {
		server_id = server_id.toHexString()
	}
	const count = params.count
	assert(is_string(server_id), "@server_id must be string")
	assert(is_string(user_id), "@user_id must be string")
	assert(is_number(count), "@count must be number")

	let since_id = params.since_id
	let max_id = params.max_id
	if (!!since_id === false && !!max_id === false) {
		return memcached_whole.fetch([server_id, user_id, count], db, params)
	}
	if (since_id instanceof ObjectID) {
		since_id = since_id.toHexString()
	}
	if (max_id instanceof ObjectID) {
		max_id = max_id.toHexString()
	}
	if (is_string(since_id) === false && is_string(max_id) === false) {
		return memcached_whole.fetch([server_id, user_id, count], db, params)
	}
	
	if (max_id) {
		// キャッシュする必要はない
		return await fetch(db, params)
	}

	return await memcached_diff.fetch([server_id, user_id, since_id, count], db, params)
}