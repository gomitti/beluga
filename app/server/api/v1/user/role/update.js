import assert, { is_number } from "../../../../assert"
import constants from "../../../../constants"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
    const community_id = try_convert_to_object_id(params.community_id, "$community_idが不正です")
    const new_role_number = params.role
    assert(is_number(new_role_number), "$role must be of type number")
    if ((new_role_number !== constants.role.admin) &&
        (new_role_number !== constants.role.moderator) &&
        (new_role_number !== constants.role.member) &&
        (new_role_number !== constants.role.guest)) {
        throw new Error("roleに不正な値が設定されています")
    }

    const result = await db.collection("user_role").updateOne(
        { user_id, community_id },
        { "$set": { "role": new_role_number } },
        { "upsert": true })

    return true
}