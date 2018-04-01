import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { convert_to_hex_string_or_null, try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.media.aggregate)

export const delete_media_aggregation_from_cache = user => {
    const user_id = try_convert_to_hex_string(user.id, "@userが不正です")
    memcached.delete(user_id)
}

export default async (db, params) => {
    const user_id = try_convert_to_hex_string(params.user_id, "@user_idを指定してください")
    return await memcached.fetch(user_id, db, params)
}