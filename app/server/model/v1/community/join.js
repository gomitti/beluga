import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const community = await memcached.v1.community.show(db, { "id": params.community_id })
    assert(community !== null, "コミュニティが見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const joined = await memcached.v1.community.joined(db, {
        "user_id": user.id,
        "community_id": community.id
    })
    assert(joined === false, "すでに参加しています")

    await api.v1.community.join(db, {
        "user_id": user.id,
        "community_id": community.id
    })

    const members_count = await db.collection("community_members").find({
        "community_id": community.id
    }).count()

    await db.collection("communities").updateOne({ "_id": community.id }, {
        "$set": { members_count }
    })

    // キャッシュの消去
    memcached.v1.community.joined.flush(community.id, user.id)
    memcached.v1.community.members.flush(community.id)
    memcached.v1.community.show.flush(community.id, community.name)

    return true
}