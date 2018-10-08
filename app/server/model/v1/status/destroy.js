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
    await api.v1.notifications.destroy(db, { "status_id": status.id })

    // キャッシュの消去
    memcached.v1.delete_status_from_cache(status.id)
    if (hashtag) {
        memcached.v1.delete_timeline_hashtag_from_cache(hashtag.id)
    }
    if (server) {
        memcached.v1.delete_timeline_server_from_cache(server.id)
    }
    if (recipient && server) {
        memcached.v1.delete_timeline_home_from_cache(recipient.id, server.id)
    }
    if(status.in_reply_to_status_id){
        const collection = db.collection("statuses")
        const comments_count = await collection.find({
            "in_reply_to_status_id": status.in_reply_to_status_id
        }).count()
        const user_ids = await collection.aggregate([
            { $match: { "in_reply_to_status_id": status.in_reply_to_status_id } },
            { $group: { _id: "$user_id" } }
        ]).toArray()

        const commenter_ids = []
        user_ids.forEach(user => {
            commenter_ids.push(user._id)
        })

        await collection.updateOne({ "_id": status.in_reply_to_status_id }, {
            "$set": { comments_count, commenter_ids }
        })

        memcached.v1.delete_status_from_cache(status.in_reply_to_status_id)
    }

    return true
}