import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string, is_number } from "../../../assert"

const fetch = api.v1.timeline.hashtag

// since_id指定時と分ける
const memcached_diff = new Memcached(fetch)
const memcached_whole = new Memcached(fetch)

export const delete_timeline_hashtag_from_cache = hashtag => {
	if (typeof hashtag.id === "string") {
		memcached_diff.delete(hashtag.id)
		memcached_whole.delete(hashtag.id)
		return
	}
	if (hashtag.id instanceof ObjectID) {
		const hashtag_id = hashtag.id.toHexString()
		memcached_diff.delete(hashtag_id)
		memcached_whole.delete(hashtag_id)
		return
	}
}

export default async (db, params) => {
	let hashtag_id = params.id
	if (hashtag_id instanceof ObjectID) {
		hashtag_id = hashtag_id.toHexString()
	}
	const count = params.count
	assert(is_string(hashtag_id), "@hashtag_id must be string")
	assert(is_number(count), "@count must be number")

	let since_id = params.since_id
	let max_id = params.max_id
	if (!!since_id === false && !!max_id === false) {
		return await memcached_whole.fetch([hashtag_id, count], db, params)
	}
	if (since_id instanceof ObjectID) {
		since_id = since_id.toHexString()
	}
	if (max_id instanceof ObjectID) {
		max_id = max_id.toHexString()
	}
	if(is_string(since_id) === false && is_string(max_id) === false){
		return await memcached_whole.fetch([hashtag_id, count], db, params)
	}

	if(max_id){
		// キャッシュする必要はない
		return await fetch(db, params)
	}

	return await memcached_diff.fetch([hashtag_id, since_id, count], db, params)
}