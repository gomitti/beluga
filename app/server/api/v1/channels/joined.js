import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
    const server_id = try_convert_to_object_id(params.server_id, "$server_idが不正です")

    const rows = await db.collection("channel_members").find({
        server_id, user_id
    }).toArray()

    const channel_ids = []
    rows.forEach(row => {
        channel_ids.push(row.channel_id)
    })
    return channel_ids
}