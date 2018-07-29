import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const server = await memcached.v1.server.show(db, { "id": params.server_id })
    assert(server !== null, "サーバーが見つかりません")

    await api.v1.hashtag.create(db, params)

    // キャッシュの消去
    memcached.v1.delete_server_hashtags_from_cache(server.id)

    return true
}