import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const status_id = try_convert_to_object_id(params.status_id, "$status_idが不正です")

    const rows = await db.collection("reactions").find({ status_id }).sort({ "created_at": 1 }).toArray()
    if (rows === null) {
        return []
    }
    const ret = []
    rows.forEach(row => {
        const { user_id, shortname, created_at, order } = row
        ret.push({ user_id, shortname, created_at, order })
    })
    return ret
}