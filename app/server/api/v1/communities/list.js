import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const rows = await db.collection("communities").find().sort({ "members_count": -1 }).toArray()
    const community_ids = []
    rows.forEach(row => {
        community_ids.push(row._id)
    })
    return community_ids
}