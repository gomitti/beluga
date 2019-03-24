import { ObjectID } from "mongodb"
import config from "../../config/beluga"
import assign from "../../lib/assign"
import api from "../../api"
import memcached from "../../memcached"
import collection from "../../collection"
import { try_convert_to_object_id, convert_to_hex_string_or_null, try_convert_to_hex_string } from "../../lib/object_id"

export default async (db, params) => {
    const timeline_params = assign(api.v1.timeline.default_params, params)
    const status_params = assign(collection.v1.status.default_params, params, {
        "requested_by": params.requested_by
    })

    const in_reply_to_status_id = try_convert_to_object_id(params.in_reply_to_status_id, "$in_reply_to_status_idが不正です")
    const status = await collection.v1.status.show(db, assign(status_params, { "id": in_reply_to_status_id }))
    if (status === null) {
        throw new Error("投稿が存在しません")
    }
    if (status.comments_count == 0) {
        try {
            const since_id = try_convert_to_hex_string(params.since_id)
            if (since_id && since_id.equals(status.id)) {
                return []
            }
        } catch (error) {
        }
        return [status]
    }

    const rows = await memcached.v1.timeline.thread(db, timeline_params)
    const statuses = []
    for (let j = 0; j < rows.length; j++) {
        const row = rows[j]
        status_params.id = row.status_id
        const status = await collection.v1.status.show(db, status_params)
        if (status) {
            statuses.push(status)
        }
    }
    return statuses
}