import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const hashtag = await memcached.v1.hashtag.show(db, { "id": params.hashtag_id })
    assert(hashtag !== null, "ルームが見つかりません")

    params.server_id = hashtag.server_id

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    await api.v1.hashtag.join(db, params)

    // キャッシュの消去
    memcached.v1.delete_hashtag_joined_from_cache(hashtag.id, user.id)
    memcached.v1.delete_hashtags_joined_from_cache(hashtag.server_id, user.id)

    return true
}