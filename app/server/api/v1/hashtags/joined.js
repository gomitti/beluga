import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
    const server_id = try_convert_to_object_id(params.server_id, "$server_idが不正です")

    const rows = await db.collection("hashtag_members").find({
        server_id, user_id
    }).toArray()

    const hashtag_ids = []
    for (const row of rows) {
        hashtag_ids.push(row.hashtag_id)
    }
    return hashtag_ids
}