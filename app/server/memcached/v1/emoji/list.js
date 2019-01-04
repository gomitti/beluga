import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import { try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.emoji.list)

const register_flush_func = target => {
    target.flush = server_id => {
        server_id = try_convert_to_hex_string(server_id, "$server_idが不正です")
        memcached.delete(server_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const server_id = try_convert_to_hex_string(params.server_id, "$server_idを指定してください")
    return await memcached.fetch(server_id, db, params)
})