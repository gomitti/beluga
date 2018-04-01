import config from "../../../config/beluga"
import assert from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const status_id = try_convert_to_object_id(params.status_id, "@status_idが不正です")

    const collection = db.collection("favorites")
    const rows = await collection.find({ status_id }).sort({ "created_at": -1 }).toArray()
    const user_ids = []
    for (const row of rows) {
        user_ids.push(row.user_id)
    }
    return user_ids
}