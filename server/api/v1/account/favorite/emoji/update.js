import config from "../../../../../config/beluga"
import logger from "../../../../../logger"
import assert from "../../../../../assert"
import { try_convert_to_object_id } from "../../../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
    assert(Array.isArray(params.shortnames), "絵文字を指定してください")

    const emoji_shortnames = []
    for (const shortname of params.shortnames) {
        try {
            assert(shortname.match(/^[a-zA-Z0-9_\-+]+$/), "不正な絵文字です")
            if (emoji_shortnames.includes(shortname)) {
                continue
            }
            emoji_shortnames.push(shortname)
        } catch (error) {

        }
    }

    const collection = db.collection("account_favorites")
    const result = await collection.updateOne({ user_id }, {
        "$set": { emoji_shortnames }
    }, { "upsert": true })

    return true
}