import config from "../../../../config/beluga"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const rows = await db.collection("muted_users").find({
        "requested_by": user_id
    }).sort({ "muted_at": 1 }).toArray()

    const user_ids = []
    rows.forEach(row => {
        user_ids.push(row.user_id_to_mute)
    })
    return user_ids
}