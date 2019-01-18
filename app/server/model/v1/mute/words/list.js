import memcached from "../../../../memcached"
import assert from "../../../../assert"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const words = await memcached.v1.mute.words.list(db, params)
    return words
}