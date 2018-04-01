import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
    const status_id = try_convert_to_object_id(params.status_id, "@status_idが不正です")
    const status_author_id = try_convert_to_object_id(params.status_author_id, "@status_author_idが不正です")

    const collection = db.collection("likes")

    const existing = await collection.findOne({ user_id, status_id })
    if (existing) {
        if (existing.count >= config.like.max_count) {
            throw new Error("これ以上いいねを付けることはできません")
        }
        const result = await collection.updateOne(
            { status_id, user_id },
            { "$inc": { "count": 1 } })
        return existing.count + 1
    }

    const count = 1
    const result = await collection.insertOne({
        status_author_id,
        status_id,
        user_id,
        count
    })
    return count
}