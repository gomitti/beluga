import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert"
import assign from "../../../lib/assign"
import config from "../../../config/beluga"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const community = await memcached.v1.community.show(db, { "id": params.community_id })
    assert(community !== null, "コミュニティが見つかりません")

    const role = await memcached.v1.user.role.get(db, { "user_id": user.id, "community_id": community.id })
    const permissions = await memcached.v1.community.permissions.get(db, { "community_id": community.id })
    const role_perms = permissions[role]
    if (role_perms.add_emoji !== true) {
        throw new Error("絵文字の追加が禁止されています")
    }

    await api.v1.emoji.add(db, params)

    memcached.v1.emoji.list.flush(community.id)
    memcached.v1.emoji.version.flush(community.id)

    return true
}