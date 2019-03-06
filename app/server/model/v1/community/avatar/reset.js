import api from "../../../../api"
import memcached from "../../../../memcached"
import assert from "../../../../assert";

export default async (db, params) => {
    const community = await memcached.v1.community.show(db, { "id": params.community_id })
    assert(community !== null, "コミュニティが見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    assert(community.created_by.equals(user.id), "権限がありません")

    const url = await api.v1.community.avatar.reset(db, params)

    // キャッシュの消去
    memcached.v1.community.show.flush(community.id, community.name)

    return url
}