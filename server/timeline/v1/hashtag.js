import { ObjectID } from "mongodb"
import config from "../../config/beluga"
import assign from "../../lib/assign"
import api from "../../api"
import model from "../../model"
import memcached from "../../memcached"
import collection from "../../collection"
import { try_convert_to_object_id } from "../../lib/object_id"

export default async (db, params) => {
    const hashtag = await model.v1.hashtag.show(db, { "id": params.hashtag_id })
    if (hashtag === null) {
        throw new Error("ルームが存在しません")
    }

    const timeline_params = assign(api.v1.timeline.default_params, params)
    const status_params = assign(collection.v1.status.default_params, {
        "trim_user": false,
        "trim_server": false,
        "trim_hashtag": false,
        "trim_recipient": false,
        "trim_favorited_by": false,
        "requested_by": params.requested_by
    })

    const rows = await memcached.v1.timeline.hashtag(db, timeline_params)
    const statuses = []
    for (const row of rows) {
        status_params.id = row.id
        const status = await collection.v1.status.show(db, status_params)
        if (status) {
            statuses.push(status)
        }
    }
    return statuses
}