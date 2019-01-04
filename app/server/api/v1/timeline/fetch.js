import config from "../../../config/beluga"
import { is_number } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, query, params) => {
    if (is_number(params.count) === false) {
        throw new Error("@countが不正です")
    }
    if (params.count > config.timeline.max_count) {
        params.count = config.timeline.max_count
    }

    if (is_number(params.sort) === false) {
        throw new Error("@sortが不正です")
    }
    if (params.sort !== 1 && params.sort !== -1) {
        throw new Error("@sortが不正です")
    }

    let sort = -1
    if (params.since_id) {
        const since_id = try_convert_to_object_id(params.since_id, "$since_idが不正です")
        query._id = { "$gt": since_id }
        sort = 1
    }
    if (params.max_id) {
        const max_id = try_convert_to_object_id(params.max_id, "$max_idが不正です")
        query._id = { "$lt": max_id }
    }

    let rows = await db.collection("statuses").find(query).sort({ "_id": sort }).limit(params.count).toArray()
    if (sort === 1) {
        rows = rows.reverse()
    }
    rows.forEach(status => {
        status.id = status._id
        for (const key in status) {
            if (key.indexOf("_") == 0) {
                delete status[key]
            }
        }
    })
    return rows
}