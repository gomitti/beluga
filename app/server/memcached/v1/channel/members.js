import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.channel.members, 3600)

const register_flush_func = target => {
    target.flush = channel_id => {
        channel_id = try_convert_to_hex_string(channel_id, "$channel_idが不正です")
        memcached.delete(channel_id)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const channel_id = try_convert_to_hex_string(params.channel_id, "$channel_idを指定してください")
    return await memcached.fetch(channel_id, db, params)
})