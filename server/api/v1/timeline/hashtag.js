import fetch from "./fetch"
import { is_string } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const hashtag_id = try_convert_to_object_id(params.hashtag_id, "@hashtag_idが不正です")
    return fetch(db, {
        hashtag_id
    }, params)
}