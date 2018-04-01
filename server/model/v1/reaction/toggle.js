import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const status = await memcached.v1.status.show(db, { "id": params.status_id })
    assert(status !== null, "投稿が見つかりません")

    if (config.status.reaction.allow_self_reactions === false) {
        assert(status.user_id.equals(user.id) === false, "自分の投稿にリアクションを追加することはできません")
    }

    const collection = db.collection("reactions")
    const existing = await collection.findOne({ "user_id": user.id, "status_id": status.id, "shortname": params.shortname })
    if (existing) {
        await api.v1.reaction.remove(db, params)
    } else {
        await api.v1.reaction.add(db, params)
    }

    // キャッシュの消去
    memcached.v1.delete_status_from_cache(status)
    memcached.v1.delete_status_reaction_from_cache(status)

    return true
}