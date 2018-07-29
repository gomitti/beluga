import { ObjectID } from "mongodb"
import api from "../../../../api"
import { Memcached } from "../../../../memcached/v1/memcached"
import assert, { is_string } from "../../../../assert"
import { try_convert_to_hex_string } from "../../../../lib/object_id"

const memcached = new Memcached(api.v1.desktop.columns.restore)

export const delete_desktop_columns_from_cache = (user_id, pathname) => {
    user_id = try_convert_to_hex_string(user_id, "@user_idが不正です")
    memcached.delete([user_id, pathname])
}

export default async (db, params) => {
    const { pathname } = params
    assert(is_string(pathname), "@pathname must be of type string")

    const user_id = try_convert_to_hex_string(params.user_id, "@user_idを指定してください")
    return await memcached.fetch([user_id, pathname], db, params)
}