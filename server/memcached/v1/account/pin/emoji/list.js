import { ObjectID } from "mongodb"
import api from "../../../../../api"
import { Memcached } from "../../../../../memcached/v1/memcached"
import assert, { is_string } from "../../../../../assert"
import { try_convert_to_hex_string } from "../../../../../lib/object_id"

const memcached = new Memcached(api.v1.account.pin.emoji.list)

export const delete_account_pin_emoji_from_cache = user_id => {
    user_id = try_convert_to_hex_string(user_id, "@user_idが不正です")
    memcached.delete(user_id)
}

export default async (db, params) => {
    const user_id = try_convert_to_hex_string(params.user_id, "@user_idを指定してください")
    return await memcached.fetch(user_id, db, params)
}