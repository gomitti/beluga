import api from "../../../../api"
import { Memcached } from "../../../../memcached/v1/memcached"
import { try_convert_to_hex_string } from "../../../../lib/object_id"

const fetch_func = api.v1.statuses.thread.count
const memcached_since_id = new Memcached(fetch_func)
const memcached_max_id = new Memcached(fetch_func)
const memcached = new Memcached(fetch_func)

const register_flush_func = target => {
    target.flush = in_reply_to_status_id => {
        in_reply_to_status_id = try_convert_to_hex_string(in_reply_to_status_id, "$in_reply_to_status_idが不正です")
        memcached_since_id.delete(in_reply_to_status_id)
        memcached_max_id.delete(in_reply_to_status_id)
        memcached.delete(in_reply_to_status_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const in_reply_to_status_id = try_convert_to_hex_string(params.in_reply_to_status_id, "$in_reply_to_status_idを指定してください")
    if (params.since_id) {
        const since_id = try_convert_to_hex_string(params.since_id, "$since_idが不正です")
        return await memcached_since_id.fetch([in_reply_to_status_id, since_id], db, params)
    }
    if (params.max_id) {
        const max_id = try_convert_to_hex_string(params.max_id, "$max_idが不正です")
        return await memcached_max_id.fetch([in_reply_to_status_id, max_id], db, params)
    }
    return await memcached.fetch(in_reply_to_status_id, db, params)
})