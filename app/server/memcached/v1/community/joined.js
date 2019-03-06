import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.community.joined)

const register_flush_func = target => {
    target.flush = (community_id, user_id) => {
        community_id = try_convert_to_hex_string(community_id, "$community_idが不正です")
        user_id = try_convert_to_hex_string(user_id, "$user_idが不正です")
        memcached.delete([community_id, user_id])
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const community_id = try_convert_to_hex_string(params.community_id, "$community_idを指定してください")
    const user_id = try_convert_to_hex_string(params.user_id, "$user_idを指定してください")
    return await memcached.fetch([community_id, user_id], db, params)
})