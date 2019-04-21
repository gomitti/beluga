import api from "../../../../api"
import memcached from "../../../../memcached"
import assert from "../../../../assert"

export default async (db, params) => {
    const community = await memcached.v1.community.show(db, { "id": params.community_id })
    assert(community !== null, "コミュニティが見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    if (community.created_by.equals(user.id) !== true) {
        throw new Error("権限がありません")
    }

    await api.v1.community.permissions.update(db, params)
    memcached.v1.community.permissions.get.flush(community.id)

    return true
}