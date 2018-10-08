import memcached from "../../../memcached"
import assert, { is_string, is_array, is_object } from "../../../assert"
import assign from "../../../lib/assign"

export default async (db, params) => {
    const { key } = params
    assert(is_string(key), "$key must be of type string")
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    return await memcached.v1.kvs.restore(db, { "user_id": user.id, "key": key })
}