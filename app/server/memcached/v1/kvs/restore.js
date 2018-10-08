import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.kvs.restore)

export const delete_kvs_from_cache = (user_id, key) => {
    assert(is_string(key), "$key must be of type string")
    user_id = try_convert_to_hex_string(user_id, "$user_idを指定してください")
    memcached.delete([user_id, key])
}

export default async (db, params) => {
    const { key } = params
    assert(is_string(key), "$key must be of type string")
    const user_id = try_convert_to_hex_string(params.user_id, "$user_idを指定してください")
    return await memcached.fetch([user_id, key], db, params)
}