import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const emoji_id = try_convert_to_object_id(params.emoji_id, "$emoji_idが不正です")

    const collection = db.collection("emojis")
    const emoji = await collection.findOne({ "_id": emoji_id })
    if (emoji === null) {
        return null
    }
    emoji.id = emoji._id
    for (const key in emoji) {
        if (key.indexOf("_") == 0) {
            delete emoji[key]
        }
    }

    return emoji
}