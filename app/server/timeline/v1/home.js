import { ObjectID } from "mongodb"
import config from "../../config/beluga"
import assign from "../../lib/assign"
import api from "../../api"
import model from "../../model"
import memcached from "../../memcached"
import collection from "../../collection"
import { try_convert_to_object_id } from "../../lib/object_id"

export default async (db, params) => {
    const user = await model.v1.user.show(db, { "id": params.user_id })
    if (user === null) {
        throw new Error("ユーザーが存在しません")
    }

    const server = await model.v1.server.show(db, { "id": params.server_id })
    if (server === null) {
        throw new Error("サーバーが存在しません")
    }

    const timeline_params = assign(api.v1.timeline.default_params, params)
    const status_params = assign(collection.v1.status.default_params, {
        "trim_user": false,
        "trim_server": false,
        "trim_channel": false,
        "trim_recipient": false,
        "trim_favorited_by": false,
        "trim_commenters": false,
        "requested_by": params.requested_by
    })

    const rows = await memcached.v1.timeline.home(db, timeline_params)
    const statuses = []
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        status_params.id = row.id
        const status = await collection.v1.status.show(db, status_params)
        if (status) {
            statuses.push(status)
        }
    }
    return statuses
}