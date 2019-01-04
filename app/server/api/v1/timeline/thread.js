import fetch from "./fetch"
import config from "../../../config/beluga";
import { is_number } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    if (params.since_id) {
        params.since_id = try_convert_to_object_id(params.since_id, "$since_idが不正です")
    }

    if (params.max_id) {
        params.max_id = try_convert_to_object_id(params.max_id, "$max_idが不正です")
    }

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

    const in_reply_to_status_id = try_convert_to_object_id(params.in_reply_to_status_id, "$in_reply_to_status_idが不正です")
    const query = { in_reply_to_status_id }

    let sort = -1
    if (params.since_id) {
        query.status_id = { "$gt": params.since_id }
        sort = 1
    }
    if (params.max_id) {
        query.status_id = { "$lt": params.max_id }
    }

    let rows = await db.collection("threads")
        .find(query)
        .sort({ "_id": sort })
        .limit(params.count)
        .toArray()
    if (sort === 1) {
        rows = rows.reverse()
    }
    return rows
}