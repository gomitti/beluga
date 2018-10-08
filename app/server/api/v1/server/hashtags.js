import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    params = Object.assign({
        "threshold": config.server.hashtags.min_statuses_count_to_display
    }, params)

    const server_id = try_convert_to_object_id(params.id, "$idが不正です")

    if (typeof params.threshold !== "number") {
        throw new Error("thresholdが不正です")
    }

    const collection = db.collection("hashtags")
    const rows = await collection.find({
        server_id,
        "statuses_count": { "$gt": params.threshold }
    }).sort({ "statuses_count": -1 }).toArray()

    for (const hashtag of rows) {
        hashtag.id = hashtag._id
        for (const key in hashtag) {
            if (key.indexOf("_") == 0) {
                delete hashtag[key]
            }
        }
    }
    return rows
}