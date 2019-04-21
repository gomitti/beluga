import api from "../../../../api"
import memcached from "../../../../memcached"
import assert from "../../../../assert"

export default async (db, params) => {
    const channel = await memcached.v1.channel.show(db, { "id": params.channel_id })
    assert(channel !== null, "チャンネルが見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    if (channel.created_by.equals(user.id) !== true) {
        throw new Error("権限がありません")
    }

    await api.v1.channel.attribute.update(db, params)

    // キャッシュの消去
    memcached.v1.channel.show.flush(channel.id, channel.community_id, channel.name)

    return true
}