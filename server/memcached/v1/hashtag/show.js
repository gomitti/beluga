import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const memcached = {
    "ids": new Memcached(api.v1.hashtag.show),
    "tagnames": new Memcached(api.v1.hashtag.show),
}

export const delete_hashtag_from_cache = hashtag => {
    const hashtag_id = try_convert_to_hex_string(hashtag.id, "@hashtagが不正です")
    const { tagname } = hashtag
    memcached.ids.delete(hashtag_id)
    memcached.tagnames.delete(tagname)
}

export default async (db, params) => {
    const hashtag_id = convert_to_hex_string_or_null(params.id)
    if (is_string(hashtag_id)) {
        return await memcached.ids.fetch(hashtag_id, db, params)
    }

    const server_id = convert_to_hex_string_or_null(params.server_id)
    const { tagname } = params
    if (is_string(server_id) && is_string(tagname)) {
        return await memcached.tagnames.fetch([server_id, tagname], db, params)
    }
    assert(false, "@idまたは(@server_id, @tagname)を指定してください")
}