import { try_convert_to_object_id } from "../../../lib/object_id"
import assert, { is_string, is_array, is_object } from "../../../assert"
import config from "../../../config/beluga"

const max_length = 10000
const max_key_length = 100

export default async (db, params) => {
    const { key, value } = params
    if (is_string(key) === false) {
        throw new Error("keyが不正です")
    }
    if (key.indexOf(".") !== -1) {
        throw new Error(`keyに.を含めることはできません`)
    }
    if (key.length > max_key_length) {
        throw new Error(`keyは${max_key_length}文字以下にしてください`)
    }
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const json_str = JSON.stringify(value)
    if (is_string(json_str) === false) {
        throw new Error("不正な値です")
    }
    if (json_str.length > max_length) {
        throw new Error("サイズが大きすぎるため保存できません")
    }
    const obj = JSON.parse(json_str)

    const collection = db.collection("kvs")
    const result = await collection.updateOne({ user_id }, {
        "$set": {
            [key]: obj
        }
    }, { "upsert": true })
}