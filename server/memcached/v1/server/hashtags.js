import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string, is_number } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.server.hashtags, 600)

export const delete_server_hashtags_from_cache = server => {
    const server_id = try_convert_to_hex_string(server.id, "@serverが不正です")
    memcached.delete(server_id)
}

export default async (db, params) => {
    const server_id = try_convert_to_hex_string(params.id, "@idを指定してください")
    const { threshold } = params
    assert(is_number(threshold), "@threshold must be of type number")
    return await memcached.fetch([server_id, threshold], db, params)
}