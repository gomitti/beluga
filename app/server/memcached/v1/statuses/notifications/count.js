import api from "../../../../api"
import { Memcached } from "../../../../memcached/v1/memcached"
import { try_convert_to_hex_string } from "../../../../lib/object_id"

const fetch_func = api.v1.statuses.notifications.count
const memcached_since_id = new Memcached(fetch_func)
const memcached_max_id = new Memcached(fetch_func)
const memcached = new Memcached(fetch_func)

const register_flush_func = target => {
    target.flush = user_id => {
        user_id = try_convert_to_hex_string(user_id, "$user_idが不正です")
        memcached_since_id.delete(user_id)
        memcached_max_id.delete(user_id)
        memcached.delete(user_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const user_id = try_convert_to_hex_string(params.user_id, "$user_idを指定してください")
    if (params.since_id) {
        const since_id = try_convert_to_hex_string(params.since_id, "$since_idが不正です")
        return await memcached_since_id.fetch([user_id, since_id], db, params)
    }
    if (params.max_id) {
        const max_id = try_convert_to_hex_string(params.max_id, "$max_idが不正です")
        return await memcached_max_id.fetch([user_id, max_id], db, params)
    }
    return await memcached.fetch(user_id, db, params)
})