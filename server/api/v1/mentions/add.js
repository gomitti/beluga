import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import { is_string } from "../../../assert"

export default async (db, params) => {
    const recipient_id = try_convert_to_object_id(params.recipient_id, "@recipient_idが不正です")
    const server_id = try_convert_to_object_id(params.server_id, "@server_idが不正です")
    const status_id = try_convert_to_object_id(params.status_id, "@status_idが不正です")

    const result = await db.collection("mentions").insertOne({
        recipient_id,
        server_id,
        status_id,
    })
    return true
}