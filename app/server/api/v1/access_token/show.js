import { ObjectID } from "mongodb"
import { sync as uid } from "uid-safe"
import config from "../../../config/beluga"
import assert, { is_object, is_string } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const token = try_convert_to_object_id(params.token, "$tokenを指定してください")
    if (is_string(params.secret) === false) {
        throw new Error("@secretを指定してください")
    }

    const document = await db.collection("access_tokens").findOne({ "_id": token })
    if (document === null) {
        return document
    }

    const { secret, user_id } = document
    assert(is_string(secret), "$secret must be of type string")
    assert(user_id instanceof ObjectID, "$user_id must be an instance of ObjectID")

    return document
}