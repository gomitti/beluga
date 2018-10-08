import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const media_id = try_convert_to_object_id(params.id, "$idが不正です")

    const media = await db.collection("media").findOne({ "_id": media_id })
    if (media === null) {
        return null
    }
    media.id = media._id
    for (const key in media) {
        if (key.indexOf("_") == 0) {
            delete media[key]
        }
    }
    return media
}