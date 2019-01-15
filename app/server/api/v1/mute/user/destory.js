import config from "../../../../config/beluga"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const user_id_to_unmute = try_convert_to_object_id(params.user_id_to_unmute, "$user_id_to_unmuteが不正です")
    const requested_by = try_convert_to_object_id(params.requested_by, "$requested_byが不正です")

    const collection = db.collection("muted_users")

    const existing = await collection.findOne({ "user_id_to_mute": user_id_to_unmute, requested_by })
    if (existing === null) {
        throw new Error("すでに解除しています")
    }

    const result = await collection.deleteOne({
        "user_id_to_mute": user_id_to_unmute, requested_by
    })
    return true
}