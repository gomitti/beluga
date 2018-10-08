import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const hashtag_id = try_convert_to_object_id(params.hashtag_id, "$hashtag_idが不正です")
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    await db.collection("hashtag_members").deleteOne({ hashtag_id, user_id })

    return true
}