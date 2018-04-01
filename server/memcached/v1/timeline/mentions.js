import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string, is_number } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const fetch = api.v1.timeline.mentions

// since_id指定時と分ける
const memcached_diff = new Memcached(fetch)
const memcached_whole = new Memcached(fetch)

export const delete_timeline_mentions_from_cache = user => {
    const user_id = try_convert_to_hex_string(user.id, "@userが不正です")
    memcached_diff.delete(user_id)
    memcached_whole.delete(user_id)
}

const fetch_all_server = async (db, params) => {
    const recipient_id = try_convert_to_hex_string(params.recipient_id, "@recipient_idを指定してください")
    const { count } = params
    assert(is_number(count), "@count must be of type number")

    const since_id = convert_to_hex_string_or_null(params.since_id)
    const max_id = convert_to_hex_string_or_null(params.max_id)
    if (since_id === null && max_id === null) {
        return await memcached_whole.fetch([recipient_id, count], db, params)
    }

    if (max_id) {
        // キャッシュする必要はない
        return await fetch(db, params)
    }

    return await memcached_diff.fetch([recipient_id, since_id, count], db, params)
}

const fetch_specified_server = async (db, params) => {
    const recipient_id = try_convert_to_hex_string(params.recipient_id, "@recipient_idを指定してください")
    const server_id = try_convert_to_hex_string(params.server_id, "@server_idを指定してください")
    const { count } = params
    assert(is_number(count), "@count must be of type number")

    const since_id = convert_to_hex_string_or_null(params.since_id)
    const max_id = convert_to_hex_string_or_null(params.max_id)
    if (since_id === null && max_id === null) {
        return await memcached_whole.fetch([recipient_id, server_id, count], db, params)
    }

    if (max_id) {
        // キャッシュする必要はない
        return await fetch(db, params)
    }

    return await memcached_diff.fetch([recipient_id, server_id, since_id, count], db, params)
}

export default async (db, params) => {
    if (params.server_id) {
        return await fetch_specified_server(db, params)
    } else {
        return await fetch_all_server(db, params)
    }
}