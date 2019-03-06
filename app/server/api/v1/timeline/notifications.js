import config from "../../../config/beluga"
import assert, { is_number } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    if (params.since_id) {
        params.since_id = try_convert_to_object_id(params.since_id, "$since_idが不正です")
    }

    if (params.max_id) {
        params.max_id = try_convert_to_object_id(params.max_id, "$max_idが不正です")
    }

    if (params.type) {
        assert(is_number(params.type), "$typeが不正です")
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
        throw new Error("@ßsortが不正です")
    }

    const query = { user_id }
    if (params.since_id) {
        query.status_id = { "$gt": params.since_id }
    }
    if (params.max_id) {
        query.status_id = { "$lt": params.max_id }
    }
    if (params.type) {
        query.type = params.type
    }

    return await db.collection("notifications").find(query).sort({ "_id": -1 }).limit(params.count).toArray()
}