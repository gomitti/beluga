import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")

    const ret = await db.collection("access_tokens").findOne({ user_id })
    if (ret === null) {
        return []
    }

    return [{
        "token": ret._id,
        "secret": ret.secret
    }]
}