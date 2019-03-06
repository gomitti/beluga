import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import assert, { is_string, is_number } from "../../../assert"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
    const status_id = try_convert_to_object_id(params.status_id, "$status_idが不正です")

    // typeの値についてはenums参照
    const { type } = params
    assert(is_number(type), "$type must be of type number")

    const query = {
        user_id,
        status_id,
        type
    }

    if (params.community_id) {
        query.community_id = try_convert_to_object_id(params.community_id, "$community_idが不正です")
    }

    const result = await db.collection("notifications").insertOne(query)
    return true
}