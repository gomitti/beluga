import constants from "../../../../constants"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
    const community_id = try_convert_to_object_id(params.community_id, "$community_idが不正です")

    const doc = await db.collection("user_role").findOne({ user_id, community_id })
    if (doc === null) {
        return constants.role.guest
    }
    return doc.role
}