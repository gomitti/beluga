import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { convert_to_hex_string_or_null, try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = {
    "ids": new Memcached(api.v1.user.show),
    "names": new Memcached(api.v1.user.show),
}

export const delete_user_from_cache = user => {
    const user_id = try_convert_to_hex_string(user.id, "@userが不正です")
    const { name } = user
    memcached.ids.delete(user_id)
    memcached.names.delete(name)
}

export default async (db, params) => {
    const user_id = convert_to_hex_string_or_null(params.id)
    if (is_string(user_id)) {
        return await memcached.ids.fetch(user_id, db, params)
    }
    const { name } = params
    if (is_string(name)) {
        return await memcached.names.fetch(name, db, params)
    }
    assert(false, "@idまたは@nameを指定してください")
}