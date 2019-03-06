import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import { try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.status.show)

const register_flush_func = target => {
    target.flush = status_id => {
        status_id = try_convert_to_hex_string(status_id, "$status_idが不正です")
        memcached.delete(status_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const status_id = try_convert_to_hex_string(params.id, "$idを指定してください")
    return await memcached.fetch(status_id, db, params)
})