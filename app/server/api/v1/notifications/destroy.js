import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import { is_string } from "../../../assert"

export default async (db, params) => {
    const status_id = try_convert_to_object_id(params.status_id, "$status_idが不正です")

    const result = await db.collection("notifications").deleteMany({
        status_id,
    })
    return true
}