import api from "../../../../api"
import { Memcached } from "../../../../memcached/v1/memcached"
import { try_convert_to_hex_string } from "../../../../lib/object_id"

const fetch_func = api.v1.statuses.community.count
const memcached_since_id = new Memcached(fetch_func)
const memcached_max_id = new Memcached(fetch_func)
const memcached = new Memcached(fetch_func)

const register_flush_func = target => {
    target.flush = community_id => {
        community_id = try_convert_to_hex_string(community_id, "$community_idが不正です")
        memcached_since_id.delete(community_id)
        memcached_max_id.delete(community_id)
        memcached.delete(community_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const community_id = try_convert_to_hex_string(params.community_id, "$community_idを指定してください")
    if (params.since_id) {
        const since_id = try_convert_to_hex_string(params.since_id, "$since_idが不正です")
        return await memcached_since_id.fetch([community_id, since_id], db, params)
    }
    if (params.max_id) {
        const max_id = try_convert_to_hex_string(params.max_id, "$max_idが不正です")
        return await memcached_max_id.fetch([community_id, max_id], db, params)
    }
    return await memcached.fetch(community_id, db, params)
})