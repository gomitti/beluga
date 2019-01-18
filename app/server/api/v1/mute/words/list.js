import config from "../../../../config/beluga"
import { try_convert_to_object_id } from "../../../../lib/object_id"
import assert, { is_array } from "../../../../assert";

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const record = await db.collection("muted_words").findOne({ user_id })
    if (record === null) {
        return []
    }
    const { words } = record
    assert(is_array(words), "$words must be of type array")
    return words
}