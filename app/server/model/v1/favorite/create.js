import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert"
import assign from "../../../lib/assign"
import config from "../../../config/beluga"
import constants from "../../../constants"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const status = await memcached.v1.status.show(db, { "id": params.status_id })
    assert(status !== null, "投稿が見つかりません")

    const { community_id, channel_id } = status
    if (community_id && channel_id) {
        const community = await memcached.v1.community.show(db, { "id": community_id })
        const channel = await memcached.v1.channel.show(db, { "id": channel_id })
        assert(community !== null, "コミュニティが見つかりません")
        assert(channel !== null, "チャンネルが見つかりません")
        const permissions = await memcached.v1.channel.permissions.get(db, { "channel_id": channel.id })
        const role = await memcached.v1.user.role.get(db, { "community_id": community.id, "user_id": user.id })
        const permissions_for_role = permissions[role]
        const allowed_to_favorite = permissions_for_role[constants.channel.permission.favorite_status]
        if (allowed_to_favorite !== true) {
            throw new Error("ふぁぼは禁止されています")
        }
    }

    await api.v1.favorite.create(db, assign(params, { "status_author_id": status.user_id }))

    // 投稿を更新
    const favorites = db.collection("favorites")
    const count = await favorites.find({ "status_id": status.id }).count()
    const collection = db.collection("statuses")
    const result = await collection.updateOne(
        { "_id": status.id },
        { "$set": { "favorites_count": count } }
    )

    // キャッシュの消去
    memcached.v1.status.show.flush(status.id)
    memcached.v1.favorite.favorited.flush(user.id, status.id)
    memcached.v1.favorite.favorited_by.flush(status.id)

    return true
}