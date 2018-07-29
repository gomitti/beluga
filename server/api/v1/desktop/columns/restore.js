import assert, { is_string, is_array } from "../../../../assert"
import config from "../../../../config/beluga"
import { try_convert_to_object_id } from "../../../../lib/object_id";

export default async (db, params) => {
    const { pathname } = params
    assert(is_string(pathname), "@pathname must be of type string")
    const max_pathname_length = 2 * (config.server.max_name_length + config.hashtag.max_tagname_length)
    assert(pathname.length <= max_pathname_length, "@pathnameが長すぎます")

    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")

    const collection = db.collection("desktop")
    const row = await collection.findOne({ user_id, pathname })
    if (!!row == false) {
        return []
    }
    const { columns } = row
    assert(is_array(columns), "@columns must be of type array")
    return columns
}