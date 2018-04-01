import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { convert_to_hex_string_or_null, try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.media.show)

export const delete_media_from_cache = media => {
    const media_id = try_convert_to_hex_string(media.id, "@mediaが不正です")
    memcached.delete(media_id)
}

export default async (db, params) => {
    const media_id = try_convert_to_hex_string(params.id, "@idを指定してください")
    return await memcached.fetch(media_id, db, params)
}