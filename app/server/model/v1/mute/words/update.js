import memcached from "../../../../memcached"
import api from "../../../../api"
import assert, { is_array, is_string } from "../../../../assert"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "対象のユーザーが見つかりません")

    const { word_array } = params
    assert(is_array(word_array), "ミュートする単語を指定してください")
    word_array.forEach(str => {
        assert(is_string(str), "$str must be of type string")
    })

    const word_set = new Set()
    word_array.forEach(str => {
        if (str.length === 0) {
            return
        }
        if (str.length > 100) {
            return
        }
        word_set.add(str)
    })
    if (word_set.size > 1000) {
        throw new Error("ミュートできる単語は1000個までです")
    }

    await api.v1.mute.words.update(db, {
        "user_id": user.id,
        "word_array": Array.from(word_set)
    })
    memcached.v1.mute.words.list.flush(user.id)

    return true
}