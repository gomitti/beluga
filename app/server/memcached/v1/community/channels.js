import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string, is_number } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.community.channels, 600)

const register_flush_func = target => {
    target.flush = community_id => {
        community_id = try_convert_to_hex_string(community_id, "$community_idが不正です")
        memcached.delete(community_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const community_id = try_convert_to_hex_string(params.id, "$idを指定してください")
    const { threshold } = params
    assert(is_number(threshold), "$threshold must be of type number")
    return await memcached.fetch([community_id, threshold], db, params)
})