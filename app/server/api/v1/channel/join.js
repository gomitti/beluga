import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    // server_idは自分が参加しているチャンネルを列挙するときに使う
    const channel_id = try_convert_to_object_id(params.channel_id, "$channel_idが不正です")
    const server_id = try_convert_to_object_id(params.server_id, "$server_idが不正です")
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const collection = db.collection("channel_members")

    const existing = await collection.findOne({ channel_id, user_id })
    if (existing !== null) {
        throw new Error("すでに参加しています")
    }

    const result = await collection.insertOne({
        channel_id, user_id, server_id,
        "joined_at": Date.now(),
    })
    return true
}