import { try_convert_to_object_id } from "../../../../lib/object_id"
import { is_number } from "../../../../assert"
import config from "../../../../config/beluga"

const verify_count = count => {
    if (is_number(count) === false) {
        throw new Error("$countが不正です")
    }
    if (count > config.timeline.max_count) {
        count = config.timeline.max_count
    }
    if (count < 0) {
        throw new Error("countは0より大きい値を指定してください")
    }
    return count
}

export default async (db, params) => {
    const query = {
        "belongs_to": try_convert_to_object_id(params.channel_id, "$channel_idが不正です")
    }

    const count = verify_count(params.count)

    let sort = -1
    if (params.since_id) {
        const since_id = try_convert_to_object_id(params.since_id, "$since_idが不正です")
        query.status_id = { "$gt": since_id }
        sort = 1
    } else if (params.max_id) {
        const max_id = try_convert_to_object_id(params.max_id, "$max_idが不正です")
        query.status_id = { "$lt": max_id }
    }

    let rows = await db.collection("channel_timeline")
        .find(query)
        .sort({ "status_id": sort })
        .limit(params.count)
        .toArray()

    if (sort === 1) {
        rows = rows.reverse()
    }

    return rows
}