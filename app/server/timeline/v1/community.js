import { ObjectID } from "mongodb"
import config from "../../config/beluga"
import api from "../../api"
import model from "../../model"
import memcached from "../../memcached"
import collection from "../../collection"
import { try_convert_to_object_id } from "../../lib/object_id"
import assign from "../../lib/assign"

export default async (db, params) => {
    const community_id = try_convert_to_object_id(params.community_id, "$community_idが不正です")

    const community = await model.v1.community.show(db, { "id": community_id })
    if (community === null) {
        throw new Error("コミュニティが存在しません")
    }

    const timeline_params = assign(api.v1.timeline.default_params, params)
    const status_params = assign(collection.v1.status.default_params, params, {
        "requested_by": params.requested_by
    })

    const rows = await memcached.v1.timeline.community(db, timeline_params)
    const statuses = []
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        status_params.id = row.status_id
        const status = await collection.v1.status.show(db, status_params)
        if (status) {
            statuses.push(status)
        }
    }
    return statuses
}