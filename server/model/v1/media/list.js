import memcached from "../../../memcached"
import assert from "../../../assert"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const list = await memcached.v1.media.list(db, params)
    assert(Array.isArray(list), "@list must be of type array")

    return list
}