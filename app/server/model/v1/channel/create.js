import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const server = await memcached.v1.server.show(db, { "id": params.server_id })
    assert(server !== null, "サーバーが見つかりません")

    const channel = await api.v1.channel.create(db, params)
    await api.v1.channel.join(db, {
        "user_id": user.id,
        "server_id": server.id,
        "channel_id": channel.id
    })

    // キャッシュの消去
    memcached.v1.server.channels.flush(server.id)
    memcached.v1.channels.joined.flush(server.id, user.id)

    return true
}