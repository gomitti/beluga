import { ObjectID } from "mongodb"
import config from "../../config/beluga"
import assign from "../../lib/assign"
import api from "../../api"
import model from "../../model"
import memcached from "../../memcached"
import collection from "../../collection"
import { try_convert_to_object_id } from "../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
    const user = await model.v1.user.show(db, { "id": user_id })
    if (user === null) {
        throw new Error("ユーザーが存在しません")
    }
    
    const server_id = try_convert_to_object_id(params.server_id, "@server_idが不正です")
    const server = await model.v1.server.show(db, { "id": server_id })
    if (server === null) {
        throw new Error("サーバーが存在しません")
    }
    
    const timeline_params = assign(api.v1.timeline.default_params, params)
    const status_params = assign(timeline_params)

    const rows = await memcached.v1.timeline.home(db, timeline_params)
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