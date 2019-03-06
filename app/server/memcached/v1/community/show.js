import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { convert_to_hex_string_or_null, try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = {
    "ids": new Memcached(api.v1.community.show),
    "names": new Memcached(api.v1.community.show),
}

const register_flush_func = target => {
    target.flush = (id, name) => {
        id = try_convert_to_hex_string(id, "$community_idが不正です")
        assert(is_string(name), "$name must be of type string")
        memcached.ids.delete(id)
        memcached.names.delete(name)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const community_id = convert_to_hex_string_or_null(params.id)
    if (is_string(community_id)) {
        return await memcached.ids.fetch(community_id, db, params)
    }
    const { name } = params
    if (is_string(name)) {
        return await memcached.names.fetch(name, db, params)
    }
    assert(false, "$idまたは$nameを指定してください")
})