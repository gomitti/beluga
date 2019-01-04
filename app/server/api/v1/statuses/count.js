import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {


    if (params.in_reply_to_status_id) {
        // スレッド
        const query = {}
        if (params.since_id) {
            const since_id = try_convert_to_object_id(params.since_id, "$since_idが不正です")
            query.status_id = { "$gt": since_id }
        }
        if (params.max_id) {
            const max_id = try_convert_to_object_id(params.max_id, "$max_idが不正です")
            query.status_id = { "$lt": max_id }
        }
        const in_reply_to_status_id = try_convert_to_object_id(params.in_reply_to_status_id, "$in_reply_to_status_idが不正です")
        query.in_reply_to_status_id = in_reply_to_status_id
        return await db.collection("threads").find(query).count()
    } else {
        const query = {}
        if (params.since_id) {
            const since_id = try_convert_to_object_id(params.since_id, "$since_idが不正です")
            query._id = { "$gt": since_id }
        }
        if (params.max_id) {
            const max_id = try_convert_to_object_id(params.max_id, "$max_idが不正です")
            query._id = { "$lt": max_id }
        }
        if (params.server_id && params.user_id) {
            // ホーム
            const server_id = try_convert_to_object_id(params.server_id, "$server_idが不正です")
            query.server_id = server_id
            const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
            query.recipient_id = user_id
        } else if (params.channel_id) {
            // チャンネル
            const channel_id = try_convert_to_object_id(params.channel_id, "$channel_idが不正です")
            query.channel_id = channel_id
        } else if (params.server_id) {
            // パブリックタイムライン
            const server_id = try_convert_to_object_id(params.server_id, "$server_idが不正です")
            query.server_id = server_id
        } else {
            throw new Error("パラメータが不正です")
        }
        return await db.collection("statuses").find(query).count()
    }
}