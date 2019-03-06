import fs from "fs"
import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import assert from "../../../assert"

export default async (db, params) => {
    const emoji_id = try_convert_to_object_id(params.emoji_id, "$emoji_idが不正です")

    const collection = db.collection("emojis")
    const emoji = await collection.findOne({ "_id": emoji_id })
    if (emoji === null) {
        throw new Error("すでに削除しています")
    }
    const result = await collection.deleteOne({ "_id": emoji_id })
    const { deletedCount } = result
    assert(deletedCount === 1, "サーバーで問題が発生しました")

    const { shortname, community_id } = emoji
    const directory = `${config.emoji.path}/${community_id}`
    const filename = `${directory}/${shortname}`
    try {
        fs.unlinkSync(filename)
    } catch (error) {
    }

    return true
}