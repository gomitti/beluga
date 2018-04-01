import { ObjectID } from "mongodb"
import config from "../../../../../config/beluga"
import logger from "../../../../../logger"
import assert from "../../../../../assert"
import { try_convert_to_object_id } from "../../../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
    assert(Array.isArray(params.media_ids), "メディアを指定してください")

    const media_ids = []
    for (const id_str of params.media_ids) {
        try {
            media_ids.push(ObjectID(id_str))
        } catch (error) {

        }
    }

    const collection = db.collection("account_favorites")
    const result = await collection.updateOne({ user_id }, {
        "$set": { media_ids }
    }, { "upsert": true })

    return true
}