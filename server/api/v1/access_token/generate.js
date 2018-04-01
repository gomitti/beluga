import { ObjectID } from "mongodb"
import { sync as uid } from "uid-safe"
import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import assert, { is_object } from "../../../assert"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")

    const secret = uid(64)
    const collection = db.collection("access_tokens")

    let deleted_token = null
    const existing = await collection.findOne({ user_id })
    if (existing !== null) {
        deleted_token = existing._id
        await collection.deleteOne({ "_id": existing._id })
    }

    const result = await collection.insertOne({ secret, user_id })
    const document = result.ops[0]
    assert(is_object(document), "@document must be of type object")
    const token = document._id
    assert(token instanceof ObjectID, "@token must be an instance of ObjectID")

    return { "token": token.toHexString(), secret, deleted_token }
}