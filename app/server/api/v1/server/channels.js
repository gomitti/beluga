import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    params = Object.assign({
        "threshold": config.server.channels.min_statuses_count_to_display
    }, params)

    const server_id = try_convert_to_object_id(params.id, "$idが不正です")

    if (typeof params.threshold !== "number") {
        throw new Error("thresholdが不正です")
    }

    const collection = db.collection("channels")
    const rows = await collection.find({
        server_id,
        "statuses_count": { "$gt": params.threshold }
    }).sort({ "statuses_count": -1 }).toArray()

    rows.forEach(channel => {
        channel.id = channel._id
        for (const key in channel) {
            if (key.indexOf("_") == 0) {
                delete channel[key]
            }
        }
    })
    return rows
}