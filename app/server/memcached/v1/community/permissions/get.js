import api from "../../../../api"
import { Memcached } from "../../../../memcached/v1/memcached"
import assert, { is_string } from "../../../../assert"
import { convert_to_hex_string_or_null, try_convert_to_hex_string } from "../../../../lib/object_id"

const memcached = new Memcached(api.v1.community.permissions.get)

const register_flush_func = target => {
    target.flush = community_id => {
        community_id = try_convert_to_hex_string(community_id, "$community_idが不正です")
        memcached.delete(community_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const community_id = try_convert_to_hex_string(params.community_id, "$community_idが不正です")
    return await memcached.fetch(community_id, db, params)
})