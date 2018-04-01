import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const status = await memcached.v1.status.show(db, { "id": params.id })
    assert(status !== null, "投稿が見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    assert(status.user_id.equals(user.id), "権限がありません")

    let hashtag = null
    if (status.hashtag_id) {
        hashtag = await memcached.v1.hashtag.show(db, { "id": status.hashtag_id })
    }
    let recipient = null
    if (status.recipient_id) {
        recipient = await memcached.v1.user.show(db, { "id": status.recipient_id })
    }
    let server = null
    if (status.server_id) {
        server = await memcached.v1.server.show(db, { "id": status.server_id })
    }

    await api.v1.status.destroy(db, params)
    await api.v1.mentions.destroy(db, { "status_id": status.id })

    // キャッシュの消去
    memcached.v1.delete_status_from_cache(status)
    if (hashtag) {
        memcached.v1.delete_timeline_hashtag_from_cache(hashtag)
    }
    if (server) {
        memcached.v1.delete_timeline_server_from_cache(server)
    }
    if (recipient && server) {
        memcached.v1.delete_timeline_home_from_cache(recipient, server)
    }

    return true
}