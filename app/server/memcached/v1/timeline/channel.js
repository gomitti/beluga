import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string, is_number } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const fetch = api.v1.timeline.channel

// since_id指定時と分ける
const memcached_diff = new Memcached(fetch)
const memcached_whole = new Memcached(fetch)

const register_flush_func = target => {
    target.flush = channel_id => {
        channel_id = try_convert_to_hex_string(channel_id, "$channel_idが不正です")
        memcached_diff.delete(channel_id)
        memcached_whole.delete(channel_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const channel_id = try_convert_to_hex_string(params.channel_id, "$channel_idを指定してください")
    const { count } = params
    assert(is_number(count), "$count must be of type number")

    const since_id = convert_to_hex_string_or_null(params.since_id)
    const max_id = convert_to_hex_string_or_null(params.max_id)
    if (since_id === null && max_id === null) {
        return await memcached_whole.fetch([channel_id, count], db, params)
    }

    if (max_id) {
        // キャッシュする必要はない
        return await fetch(db, params)
    }

    return await memcached_diff.fetch([channel_id, since_id, count], db, params)
})