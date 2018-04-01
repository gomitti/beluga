import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
    const status_id = try_convert_to_object_id(params.status_id, "@status_idが不正です")

    const { shortname } = params
    if (typeof shortname !== "string") {
        throw new Error("追加するリアクションを指定してください")
    }
    if (!!shortname.match(/[a-zA-Z0-9_\-+]+/) === false) {
        throw new Error("追加するリアクションを指定してください")
    }

    const collection = db.collection("reactions")

    const existing = await collection.findOne({ user_id, status_id, shortname })
    if (!existing) {
        throw new Error("すでに削除されています")
    }

    const result = await collection.deleteOne({ user_id, status_id, shortname })
    return 0
}