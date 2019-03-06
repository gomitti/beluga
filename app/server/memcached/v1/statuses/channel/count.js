import api from "../../../../api"
import { Memcached } from "../../../../memcached/v1/memcached"
import { try_convert_to_hex_string } from "../../../../lib/object_id"

const fetch_func = api.v1.statuses.channel.count
const memcached_since_id = new Memcached(fetch_func)
const memcached_max_id = new Memcached(fetch_func)
const memcached = new Memcached(fetch_func)

const register_flush_func = target => {
    target.flush = channel_id => {
        channel_id = try_convert_to_hex_string(channel_id, "$channel_idが不正です")
        memcached_since_id.delete(channel_id)
        memcached_max_id.delete(channel_id)
        memcached.delete(channel_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const channel_id = try_convert_to_hex_string(params.channel_id, "$channel_idを指定してください")
    if (params.since_id) {
        const since_id = try_convert_to_hex_string(params.since_id, "$since_idが不正です")
        return await memcached_since_id.fetch([channel_id, since_id], db, params)
    }
    if (params.max_id) {
        const max_id = try_convert_to_hex_string(params.max_id, "$max_idが不正です")
        return await memcached_max_id.fetch([channel_id, max_id], db, params)
    }
    return await memcached.fetch(channel_id, db, params)
})