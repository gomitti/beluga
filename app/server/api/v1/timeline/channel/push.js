import { is_string } from "../../../../assert"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const query = {
        "status_id": try_convert_to_object_id(params.status_id, "$status_idが不正です"),
        "user_id": try_convert_to_object_id(params.user_id, "$user_idが不正です"),
        "belongs_to": try_convert_to_object_id(params.channel_id, "$channel_idが不正です")
    }
    const result = await db.collection("channel_timeline").insertOne(query)
    return true
}