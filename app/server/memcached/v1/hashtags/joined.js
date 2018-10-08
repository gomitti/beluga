import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert from "../../../assert"
import { try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.hashtags.joined)

export const delete_hashtags_joined_from_cache = (server_id, user_id) => {
    server_id = try_convert_to_hex_string(server_id, "$serverが不正です")
    user_id = try_convert_to_hex_string(user_id, "$userが不正です")
    memcached.delete([server_id, user_id])
}

export default async (db, params) => {
    const server_id = try_convert_to_hex_string(params.server_id, "$server_idを指定してください")
    const user_id = try_convert_to_hex_string(params.user_id, "$user_idを指定してください")
    return await memcached.fetch([server_id, user_id], db, params)
}