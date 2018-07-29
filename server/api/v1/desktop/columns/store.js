import { try_convert_to_object_id } from "../../../../lib/object_id"
import assert, { is_string, is_array, is_object } from "../../../../assert"
import config from "../../../../config/beluga"

export default async (db, params) => {
    const { pathname, columns } = params

    assert(is_string(pathname), "@pathname must be of type string")
    const max_pathname_length = 2 * (config.server.max_name_length + config.hashtag.max_tagname_length)
    assert(pathname.length <= max_pathname_length, "@pathnameが長すぎます")

    const collection = db.collection("desktop")
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")

    assert(is_array(columns), "@columns must be of type array")

    const available_param_ids = ["hashtag_id", "server_id", "user_id"]
    const available_types = ["home", "hashtag", "server"]
    const documents = []

    for (const column of columns) {
        assert(is_object(column), "@column must be of type object")
        const { param_ids, type } = column
        assert(is_string(type), "@pathname must be of type string")
        if (!!available_types.includes(type) == false) {
            throw new Error("@typeが不正です")
        }
        if (Object.keys(param_ids) == 0) {
            throw new Error("@request_queryが不正です")
        }
        assert(is_object(param_ids), "@param_ids must be of type object")
        for (const key in param_ids) {
            if (!!available_param_ids.includes(key) == false) {
                throw new Error("@keyが不正です")
            }
            param_ids[key] = try_convert_to_object_id(param_ids[key])
        }
        documents.push({ param_ids, type })
    }

    const result = await collection.updateOne({ user_id, pathname }, {
        "$set": {
            "columns": documents
        }
    }, { "upsert": true })
}