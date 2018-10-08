import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { convert_to_hex_string_or_null, try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = {
    "ids": new Memcached(api.v1.server.show),
    "names": new Memcached(api.v1.server.show),
}

export const delete_server_from_cache = (server_id, name) => {
    server_id = try_convert_to_hex_string(server_id, "$server_idが不正です")
    assert(is_string(name), "$name must be of type string")
    memcached.ids.delete(server_id)
    memcached.names.delete(name)
}

export default async (db, params) => {
    const server_id = convert_to_hex_string_or_null(params.id)
    if (is_string(server_id)) {
        return await memcached.ids.fetch(server_id, db, params)
    }
    const { name } = params
    if (is_string(name)) {
        return await memcached.names.fetch(name, db, params)
    }
    assert(false, "$idまたは@nameを指定してください")
}