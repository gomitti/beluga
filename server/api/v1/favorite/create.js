import config from "../../../config/beluga"
import assert from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
    const status_id = try_convert_to_object_id(params.status_id, "@status_idが不正です")
    const status_author_id = try_convert_to_object_id(params.status_author_id, "@status_author_idが不正です")
    
    const collection = db.collection("favorites")
    const existing = await collection.findOne({ status_id, user_id })
    if (existing) {
        throw new Error("すでにお気に入りに登録しています")
    }

    const result = await collection.insertOne({
        "created_at": Date.now(),
        status_author_id,
        status_id,
        user_id
    })
    return true
}