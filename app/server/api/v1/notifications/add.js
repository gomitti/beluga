import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import assert, { is_string, is_number } from "../../../assert"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
    const server_id = try_convert_to_object_id(params.server_id, "$server_idが不正です")
    const status_id = try_convert_to_object_id(params.status_id, "$status_idが不正です")
    const { type } = params
    assert(is_number(type), "$type must be of type number")

    const result = await db.collection("notifications").insertOne({
        user_id,
        server_id,
        status_id,
        type
    })
    return true
}