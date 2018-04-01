import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const hashtag = await memcached.v1.hashtag.show(db, { "id": params.hashtag_id })
    assert(hashtag !== null, "ルームが見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    assert(hashtag.created_by.equals(user.id), "権限がありません")

    await api.v1.hashtag.update(db, params)

    // キャッシュの消去
    memcached.v1.delete_hashtag_from_cache(hashtag)

    return true
}