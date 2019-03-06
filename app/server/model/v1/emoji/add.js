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

    if (community.only_admin_can_add_emoji) {
        if (user.id.equals(community.created_by) === false) {
            throw new Error("権限がありません")
        }
    }

    await api.v1.emoji.add(db, params)

    memcached.v1.emoji.list.flush(community.id)
    memcached.v1.emoji.version.flush(community.id)

    return true
}