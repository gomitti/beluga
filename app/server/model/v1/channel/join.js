import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const channel = await memcached.v1.channel.show(db, { "id": params.channel_id })
    assert(channel !== null, "チャンネルが見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    let joined = await memcached.v1.channel.joined(db, {
        "user_id": user.id,
        "channel_id": channel.id
    })
    assert(joined === false, "すでに参加しています")

    if (channel.invitation_needed) {
        throw new Error("このチャンネルは承認制のため参加できません")
    }

    joined = await memcached.v1.server.joined(db, {
        "user_id": user.id,
        "server_id": channel.server_id
    })
    assert(joined === true, "サーバーに参加していないため、このサーバー上のチャンネルには参加できません")

    await api.v1.channel.join(db, {
        "user_id": user.id,
        "server_id": channel.server_id,
        "channel_id": channel.id,
    })

    // キャッシュの消去
    memcached.v1.channel.joined.flush(channel.id, user.id)
    memcached.v1.channels.joined.flush(channel.server_id, user.id)

    return true
}