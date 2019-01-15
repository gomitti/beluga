import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const channel = await memcached.v1.channel.show(db, { "id": params.channel_id })
    assert(channel !== null, "チャンネルが見つかりません")

    if (channel.invitation_needed === false) {
        throw new Error("このチャンネルは公開チャンネルのため招待する必要はありません")
    }

    const requested_user = await memcached.v1.user.show(db, { "id": params.requested_user_id })
    assert(requested_user !== null, "ユーザーが見つかりません")

    if (channel.created_by.equals(requested_user.id) === false) {
        assert(requested_user !== null, "権限がありません")
    }

    const user_to_invite = await memcached.v1.user.show(db, { "id": params.user_id_to_invite })
    assert(user_to_invite !== null, "ユーザーが見つかりません")

    const already_in_channel = await memcached.v1.channel.joined(db, {
        "user_id": user_to_invite.id,
        "channel_id": channel.id
    })
    assert(already_in_channel === false, "このユーザーはすでに参加しています")

    const already_in_server = await memcached.v1.server.joined(db, {
        "user_id": user_to_invite.id,
        "server_id": channel.server_id
    })
    assert(already_in_server === true, "このユーザーはチャンネルが所属するサーバーに参加していないため招待できません")

    await api.v1.channel.join(db, {
        "user_id": user_to_invite.id,
        "server_id": channel.server_id,
        "channel_id": channel.id,
    })

    // キャッシュの消去
    memcached.v1.channel.joined.flush(channel.id, user_to_invite.id)
    memcached.v1.channels.joined.flush(channel.server_id, user_to_invite.id)
    memcached.v1.channel.members.flush(channel.id)

    return true
}