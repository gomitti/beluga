import config from "../../../config/beluga"
import assert from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
    const status_id = try_convert_to_object_id(params.status_id, "@status_idが不正です")

    const collection = db.collection("favorites")
    const existing = await collection.findOne({ status_id, user_id })
    if (existing) {
        return true
    }
    return false
}