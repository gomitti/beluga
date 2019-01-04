import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const channel_id = try_convert_to_object_id(params.channel_id, "$channel_idが不正です")
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    await db.collection("channel_members").deleteOne({ channel_id, user_id })

    return true
}