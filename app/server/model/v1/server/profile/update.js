import api from "../../../../api"
import memcached from "../../../../memcached"
import assert from "../../../../assert";

export default async (db, params) => {
    const server = await memcached.v1.server.show(db, { "id": params.server_id })
    assert(server !== null, "サーバーが見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    assert(server.created_by.equals(user.id), "権限がありません")

    await api.v1.server.profile.update(db, params)

    // キャッシュの消去
    memcached.v1.server.show.flush(server.id, server.name)

    return true
}