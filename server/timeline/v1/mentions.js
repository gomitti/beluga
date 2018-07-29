import config from "../../config/beluga"
import api from "../../api"
import model from "../../model"
import memcached from "../../memcached"
import collection from "../../collection"
import { try_convert_to_object_id } from "../../lib/object_id"
import assign from "../../lib/assign"

export default async (db, params) => {
    const timeline_params = assign(api.v1.timeline.default_params, params)

    if (params.server_id) {
        const server_id = try_convert_to_object_id(params.server_id, "@idが不正です")
        const server = await model.v1.server.show(db, { "id": server_id })
        if (server === null) {
            throw new Error("サーバーが存在しません")
        }
    }

    const status_params = assign(collection.v1.status.default_params, {
        "trim_user": false,
        "trim_server": false,
        "trim_hashtag": false,
        "trim_recipient": false,
        "trim_favorited_by": false,
        "requested_by": params.requested_by
    })

    const rows = await memcached.v1.timeline.mentions(db, timeline_params)
    const statuses = []
    for (const row of rows) {
        status_params.id = row.status_id
        const status = await collection.v1.status.show(db, status_params)
        if (status) {
            statuses.push(status)
        }
    }
    return statuses
}