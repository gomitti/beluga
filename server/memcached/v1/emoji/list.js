import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import { try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.emoji.list)

export const delete_emoji_list_from_cache = server_id => {
    server_id = try_convert_to_hex_string(server_id, "@server_idが不正です")
    memcached.delete(server_id)
}

export default async (db, params) => {
    const server_id = try_convert_to_hex_string(params.server_id, "@server_idを指定してください")
    return await memcached.fetch(server_id, db, params)
}