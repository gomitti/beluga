import config from "../../../config/beluga"
import assert, { is_string } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const community_id = try_convert_to_object_id(params.community_id, "$community_idが不正です")
    const rows = await db.collection("emojis").find({ community_id }).sort({ "_id": -1 }).limit(1).toArray()
    if (rows.length === 0) {
        return 0
    }
    const row = rows[0]
    const { _id } = row
    return _id.toHexString()
}