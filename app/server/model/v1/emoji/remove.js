import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert"
import assign from "../../../lib/assign"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const emoji = await api.v1.emoji.show(db, params)
    assert(emoji !== null, "絵文字が存在しません")

    assert(emoji.added_by.equals(user.id), "自分が登録した絵文字以外を削除することはできません")

    await api.v1.emoji.remove(db, params)

    memcached.v1.emoji.list.flush(emoji.server_id)
    return true
}