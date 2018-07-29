import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert"
import assign from "../../../lib/assign"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const server = await memcached.v1.server.show(db, { "id": params.server_id })
    assert(server !== null, "サーバーが見つかりません")

    await api.v1.emoji.add(db, params)

    memcached.v1.delete_emoji_list_from_cache(server.id)

    return true
}