import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const memcached = {
    "ids": new Memcached(api.v1.channel.show),
    "names": new Memcached(api.v1.channel.show),
}


const register_flush_func = target => {
    target.flush = (id, name) => {
        id = try_convert_to_hex_string(id, "$channel_idが不正です")
        assert(is_string(name), "$name must be of type string")
        memcached.ids.delete(id)
        memcached.names.delete(name)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const channel_id = convert_to_hex_string_or_null(params.id)
    if (is_string(channel_id)) {
        return await memcached.ids.fetch(channel_id, db, params)
    }
    const server_id = convert_to_hex_string_or_null(params.server_id)
    const { name } = params
    if (is_string(server_id) && is_string(name)) {
        return await memcached.names.fetch([server_id, name], db, params)
    }
    assert(false, "$idまたは(@server_id, $name)を指定してください")
})