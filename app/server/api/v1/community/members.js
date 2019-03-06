import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const community_id = try_convert_to_object_id(params.community_id, "$community_idが不正です")

    const collection = db.collection("community_members")
    const rows = await collection.find({
        community_id,
    }).sort({ "joined_at": 1 }).toArray()

    const user_ids = []
    rows.forEach(row => {
        user_ids.push(row.user_id)
    })
    return user_ids
}