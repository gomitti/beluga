import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { convert_to_hex_string_or_null, try_convert_to_hex_string } from "../../../lib/object_id"

const fetch_func = api.v1.user.show
const memcached_id = new Memcached(fetch_func)
const memcached_name = new Memcached(fetch_func)

const register_flush_func = target => {
    target.flush = (id, name) => {
        id = try_convert_to_hex_string(id, "$user_idが不正です")
        assert(is_string(name), "$name must be of type string")
        memcached_id.delete(id)
        memcached_name.delete(name)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const user_id = convert_to_hex_string_or_null(params.id)
    if (is_string(user_id)) {
        return await memcached_id.fetch(user_id, db, params)
    }
    const { name } = params
    if (is_string(name)) {
        return await memcached_name.fetch(name, db, params)
    }
    throw new Error("$idまたは$nameを指定してください")
})