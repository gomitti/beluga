import config from "../../../../config/beluga"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const target_user_id = try_convert_to_object_id(params.target_user_id, "$target_user_idが不正です")
    const requested_by = try_convert_to_object_id(params.requested_by, "$requested_byが不正です")

    const collection = db.collection("mutes")

    const existing = await collection.findOne({ target_user_id, requested_by })
    if (existing !== null) {
        throw new Error("すでにミュートしています")
    }

    const result = await collection.insertOne({
        target_user_id, requested_by,
        "muted_at": Date.now(),
    })
    return true
}