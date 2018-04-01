import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string, is_number } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const fetch = api.v1.timeline.hashtag

// since_id指定時と分ける
const memcached_diff = new Memcached(fetch)
const memcached_whole = new Memcached(fetch)

export const delete_timeline_hashtag_from_cache = hashtag => {
    const hashtag_id = try_convert_to_hex_string(hashtag.id, "@hashtagが不正です")
    memcached_diff.delete(hashtag_id)
    memcached_whole.delete(hashtag_id)
}

export default async (db, params) => {
    const hashtag_id = try_convert_to_hex_string(params.id, "@idを指定してください")
    const { count } = params
    assert(is_number(count), "@count must be of type number")

    const since_id = convert_to_hex_string_or_null(params.since_id)
    const max_id = convert_to_hex_string_or_null(params.max_id)
    if (since_id === null && max_id === null) {
        return await memcached_whole.fetch([hashtag_id, count], db, params)
    }

    if (max_id) {
        // キャッシュする必要はない
        return await fetch(db, params)
    }

    return await memcached_diff.fetch([hashtag_id, since_id, count], db, params)
}