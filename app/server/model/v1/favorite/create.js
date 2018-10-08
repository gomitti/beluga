import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert"
import assign from "../../../lib/assign"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const status = await memcached.v1.status.show(db, { "id": params.status_id })
    assert(status !== null, "投稿が見つかりません")

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
    memcached.v1.delete_status_from_cache(status.id)
    memcached.v1.delete_status_favorited_from_cache(user.id, status.id)
    memcached.v1.delete_status_favorited_by_from_cache(status.id)

    return true
}