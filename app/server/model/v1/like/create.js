import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";
import assign from "../../../lib/assign";

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const status = await memcached.v1.status.show(db, { "id": params.status_id })
    assert(status !== null, "投稿が見つかりません")
    assert(status.user_id.equals(user.id) === false, "自分の投稿にいいねすることはできません")

    await api.v1.like.create(db, assign(params, { "status_author_id": status.user_id }))

    // 投稿を更新
    const collection = db.collection("statuses")
    const result = await collection.updateOne(
        { "_id": status.id },
        { "$inc": { "likes_count": 1 } }
    )

    // キャッシュの消去
    memcached.v1.delete_status_from_cache(status.id)

    return true
}