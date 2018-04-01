import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.favorite.favorited_by)

export const delete_status_favorited_by_from_cache = status => {
    const status_id = try_convert_to_hex_string(status.id, "@statusが不正です")
    memcached.delete(status_id)
}

export default async (db, params) => {
    const status_id = try_convert_to_hex_string(params.status_id, "@status_idを指定してください")
    return await memcached.fetch(status_id, db, params)
}