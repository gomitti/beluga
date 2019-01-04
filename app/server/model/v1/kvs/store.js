import api from "../../../api"
import memcached from "../../../memcached"
import assert, { is_string, is_array, is_object } from "../../../assert"
import assign from "../../../lib/assign"
import { try_convert_to_object_id } from "../../../lib/object_id";

export default async (db, params) => {
    const { key, value } = params
    assert(is_string(key), "$key must be of type string")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    await api.v1.kvs.store(db, { "user_id": user.id, "key": key, "value": value })

    // キャッシュの消去
    memcached.v1.kvs.restore.flush(user.id, key)

    return true
}