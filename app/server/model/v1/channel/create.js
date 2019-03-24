import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const community = await memcached.v1.community.show(db, { "id": params.community_id })
    assert(community !== null, "コミュニティが見つかりません")

    const role = await memcached.v1.user.role.get(db, { "user_id": user.id, "community_id": community.id })
    const permissions = await memcached.v1.community.permissions.get(db, { "community_id": community.id })
    const role_perms = permissions[role]
    if (role_perms.create_channel !== true) {
        throw new Error("チャンネルの作成が禁止されています")
    }

    const channel = await api.v1.channel.create(db, params)
    await api.v1.channel.join(db, {
        "user_id": user.id,
        "community_id": community.id,
        "channel_id": channel.id
    })

    // キャッシュの消去
    memcached.v1.community.channels.flush(community.id)
    memcached.v1.channels.joined.flush(community.id, user.id)

    return true
}