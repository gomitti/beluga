import assert, { is_string, is_array } from "../../../assert"
import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id";

export default async (db, params) => {
    const { key } = params
    if (is_string(key) === false) {
        throw new Error("@keyが不正です")
    }

    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const collection = db.collection("kvs")
    const row = await collection.findOne({ user_id })
    if (row === null) {
        return null
    }
    const value = row[key]
    if (!!value === false) {
        return null
    }
    return value
}