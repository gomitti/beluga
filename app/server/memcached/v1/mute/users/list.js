import api from "../../../../api"
import { Memcached } from "../../../../memcached/v1/memcached"
import assert from "../../../../assert"
import { try_convert_to_hex_string } from "../../../../lib/object_id"

const memcached = new Memcached(api.v1.mute.users.list)

const register_flush_func = target => {
    target.flush = (user_id) => {
        user_id = try_convert_to_hex_string(user_id, "$userが不正です")
        memcached.delete([user_id])
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const user_id = try_convert_to_hex_string(params.user_id, "$user_idを指定してください")
    return await memcached.fetch([user_id], db, params)
})