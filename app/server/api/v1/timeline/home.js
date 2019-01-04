import fetch from "./fetch"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const recipient_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
    const server_id = try_convert_to_object_id(params.server_id, "$server_idが不正です")
    return fetch(db, { recipient_id, server_id }, params)
}