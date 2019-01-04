import fetch from "./fetch"
import { is_string } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const channel_id = try_convert_to_object_id(params.channel_id, "$channel_idが不正です")
    return fetch(db, {
        channel_id
    }, params)
}