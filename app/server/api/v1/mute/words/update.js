import config from "../../../../config/beluga"
import { try_convert_to_object_id } from "../../../../lib/object_id"
import assert, { is_array, is_string } from "../../../../assert"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const { word_array } = params
    assert(is_array(word_array), "ミュートする単語を指定してください")
    word_array.forEach(str => {
        assert(is_string(str), "$str must be of type string")
    })

    const result = await db.collection("muted_words").updateOne({ user_id }, {
        $set: { "words": word_array }
    }, { "upsert": true })

    return true
}