import fetch from "./fetch"
import { is_string } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const in_reply_to_status_id = try_convert_to_object_id(params.in_reply_to_status_id, "$in_reply_to_status_idが不正です")
    return fetch(db, {
        in_reply_to_status_id
    }, params)
}