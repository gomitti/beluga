import { try_convert_to_object_id } from "../../../lib/object_id"
import assert from "../../../assert";

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const collection = db.collection("media")
    const rows = await collection.aggregate(
        [
            { "$match": { user_id } },
            { "$group": { total_bytes: { "$sum": "$bytes" }, _id: null, count: { "$sum": 1 } } }]
    ).toArray()
    if (rows.length !== 1) {
        return {
            "count": 0,
            "total_bytes": 0
        }
    }
    const result = rows[0]
    return {
        "count": result.count,
        "total_bytes": result.total_bytes
    }
}