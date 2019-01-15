import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const channel = await memcached.v1.channel.show(db, { "id": params.channel_id })
    assert(channel !== null, "チャンネルが見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    assert(channel.created_by.equals(user.id), "権限がありません")

    await api.v1.channel.update(db, params)

    // キャッシュの消去
    memcached.v1.channel.show.flush(channel.id, channel.server_id, channel.name)
    memcached.v1.server.channels.flush(channel.server_id)

    return true
}