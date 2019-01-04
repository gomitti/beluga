import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const server_id = try_convert_to_object_id(params.server_id, "$server_idが不正です")
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const collection = db.collection("server_members")

    const existing = await collection.findOne({ server_id, user_id })
    if (existing !== null) {
        throw new Error("すでに参加しています")
    }

    const result = await collection.insertOne({
        server_id, user_id,
        "joined_at": Date.now(),
    })
    return true
}