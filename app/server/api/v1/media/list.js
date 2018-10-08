import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    params = Object.assign({
        "count": config.media.list.default_count
    }, params)

    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const collection = db.collection("media")
    const rows = await collection.find({ user_id }).sort({ "created_at": -1 }).limit(params.count).toArray()

    for (const media of rows) {
        media.id = media._id
        for (const key in media) {
            if (key.indexOf("_") == 0) {
                delete media[key]
            }
        }
    }

    return rows
}