import config from "../../../../config/beluga"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const user_id_to_mute = try_convert_to_object_id(params.user_id_to_mute, "$user_id_to_muteが不正です")
    const requested_by = try_convert_to_object_id(params.requested_by, "$requested_byが不正です")

    const collection = db.collection("muted_users")

    const existing = await collection.findOne({ user_id_to_mute, requested_by })
    if (existing !== null) {
        throw new Error("すでにミュートしています")
    }

    const result = await collection.insertOne({
        user_id_to_mute, requested_by,
        "muted_at": Date.now(),
    })
    return true
}