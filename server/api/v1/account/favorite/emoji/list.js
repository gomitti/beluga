import storage from "../../../../../config/storage"
import config from "../../../../../config/beluga"
import { try_convert_to_object_id } from "../../../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
    const collection = db.collection("account_favorites")
    const bookmark = await collection.findOne({ user_id })
    if (!bookmark) {
        return []
    }
    return bookmark.emoji_shortnames || []
}