import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.hashtag.joined)

export const delete_hashtag_joined_from_cache = (hashtag_id, user_id) => {
    hashtag_id = try_convert_to_hex_string(hashtag_id, "@hashtag_idが不正です")
    user_id = try_convert_to_hex_string(user_id, "@user_idが不正です")
    memcached.delete([hashtag_id, user_id])
}

export default async (db, params) => {
    const hashtag_id = try_convert_to_hex_string(params.hashtag_id, "@hashtag_idを指定してください")
    const user_id = try_convert_to_hex_string(params.user_id, "@user_idを指定してください")
    return await memcached.fetch([hashtag_id, user_id], db, params)
}