import config from "../../../../config/beluga"
import logger from "../../../../logger"
import assert, { is_string } from "../../../../assert"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const channel_id = try_convert_to_object_id(params.channel_id, "$channel_idが不正です")

    const collection = db.collection("channels")
    const channel = await collection.findOne({ "_id": channel_id })
    assert(channel !== null, "ユーザーが存在しません")

    const attributes = {
        "is_public": true,
        "invitation_needed": false,
    }
    for (const key in attributes) {
        if (params.hasOwnProperty(key)) {
            attributes[key] = params[key]
        }
    }

    const result = await collection.updateOne({ "_id": channel_id }, {
        "$set": attributes
    })
    return true
}