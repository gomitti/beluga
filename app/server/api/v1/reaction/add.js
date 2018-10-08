import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import { is_string } from "../../../assert"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
    const status_id = try_convert_to_object_id(params.status_id, "$status_idが不正です")

    const { shortname } = params
    if (is_string(shortname) === false) {
        throw new Error("追加するリアクションを指定してください")
    }
    if (!!shortname.match(/[a-zA-Z0-9_\-+]+/) === false) {
        throw new Error("追加するリアクションを指定してください")
    }

    const collection = db.collection("reactions")

    const count = await collection.find({ user_id, status_id }).count()
    if (count >= config.status.reaction.limit) {
        throw new Error("これ以上リアクションを追加することはできません")
    }

    const existing = await collection.findOne({ user_id, status_id, shortname })
    if (existing) {
        throw new Error("同じリアクションを追加することはできません")
    }

    const result = await collection.insertOne({
        user_id,
        status_id,
        shortname,
        "created_at": Date.now()
    })
    return 0
}