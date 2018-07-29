import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string, is_number, is_object } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const fetch = api.v1.timeline.home

// since_id指定時と分ける
const memcached_diff = new Memcached(fetch)
const memcached_whole = new Memcached(fetch)

export const delete_timeline_home_from_cache = (user_id, server_id) => {
    server_id = try_convert_to_hex_string(server_id, "@server_idが不正です")
    user_id = try_convert_to_hex_string(user_id, "@user_idが不正です")
    memcached_diff.delete([server_id, user_id])
    memcached_whole.delete([server_id, user_id])
}

export default async (db, params) => {
    const user_id = try_convert_to_hex_string(params.user_id, "@user_idを指定してください")
    const server_id = try_convert_to_hex_string(params.server_id, "@server_idを指定してください")
    const { count } = params
    assert(is_number(count), "@count must be of type number")

    const since_id = convert_to_hex_string_or_null(params.since_id)
    const max_id = convert_to_hex_string_or_null(params.max_id)
    if (since_id === null && max_id === null) {
        return await memcached_whole.fetch([server_id, user_id, count], db, params)
    }

    if (max_id) {
        // キャッシュする必要はない
        return await fetch(db, params)
    }

    return await memcached_diff.fetch([server_id, user_id, since_id, count], db, params)
}