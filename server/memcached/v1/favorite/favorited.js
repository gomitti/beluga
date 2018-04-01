import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.favorite.favorited)

export const delete_status_favorited_from_cache = status => {
    const status_id = try_convert_to_hex_string(status.id, "@statusが不正です")
    delete_cache_by_key(status.id)
}

export default async (db, params) => {
    const user_id = try_convert_to_hex_string(params.user_id, "@user_idが不正です")
    const status_id = try_convert_to_hex_string(params.status_id, "@status_idが不正です")

    return await memcached.fetch([user_id, status_id], db, params)
}