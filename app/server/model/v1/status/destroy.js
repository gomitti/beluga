import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const status = await memcached.v1.status.show(db, { "id": params.id })
    assert(status !== null, "投稿が見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    assert(status.user_id.equals(user.id), "権限がありません")

    await api.v1.status.destroy(db, params)
    await api.v1.notifications.destroy(db, { "status_id": status.id })

    if (status.in_reply_to_status_id) {
        // タイムラインから削除
        await db.collection("thread_timeline").deleteOne({ "status_id": status.id })

        // コメント数を更新
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

        // ダミーのコメントを消しておく
        if (comments_count === 0) {
            await db.collection("threads").deleteOne({ "status_id": status.in_reply_to_status_id })
        }

        memcached.v1.status.show.flush(status.in_reply_to_status_id)
    }
    if (status.channel_id) {
        const channel = await memcached.v1.channel.show(db, { "id": status.channel_id })
        if (channel) {
            // タイムラインから削除
            await db.collection("channel_timeline").deleteOne({ "status_id": status.id })

            // 投稿数を更新
            const statuses_count = await db.collection("statuses").find({
                "channel_id": status.channel_id
            }).count()
            await db.collection("channels").updateOne({ "_id": channel.id }, {
                "$set": { statuses_count }
            })

            memcached.v1.timeline.channel.flush(channel.id)
            memcached.v1.channel.show.flush(channel.id, status.community_id, channel.name)
        }
    }
    if (status.community_id) {
        // タイムラインから削除
        await db.collection("community_timeline").deleteOne({ "status_id": status.id })
        memcached.v1.timeline.community.flush(status.community_id)
    }
    if (status.recipient_id) {
        // タイムラインから削除
        await db.collection("message_timeline").deleteOne({ "status_id": status.id })
        memcached.v1.timeline.message.flush(status.recipient_id)
    }

    // キャッシュの消去
    memcached.v1.status.show.flush(status.id)

    return true
}