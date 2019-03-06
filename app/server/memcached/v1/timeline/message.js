import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string, is_number, is_object } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const fetch_func = api.v1.timeline.message.fetch

// since_id指定時と分ける
const memcached_diff = new Memcached(fetch_func)
const memcached_all = new Memcached(fetch_func)

const register_flush_func = target => {
    target.flush = (recipient_id) => {
        recipient_id = try_convert_to_hex_string(recipient_id, "$recipient_idが不正です")
        memcached_diff.delete(recipient_id)
        memcached_all.delete(recipient_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const recipient_id = try_convert_to_hex_string(params.recipient_id, "$recipient_idを指定してください")
    const { count } = params
    assert(is_number(count), "$count must be of type number")

    const since_id = convert_to_hex_string_or_null(params.since_id)
    const max_id = convert_to_hex_string_or_null(params.max_id)
    if (since_id === null && max_id === null) {
        return await memcached_all.fetch([recipient_id, count], db, params)
    }

    if (max_id) {
        // キャッシュする必要はない
        return await fetch_func(db, params)
    }

    return await memcached_diff.fetch([recipient_id, since_id, count], db, params)
})