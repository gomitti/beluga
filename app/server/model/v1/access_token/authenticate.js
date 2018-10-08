import { ObjectID } from "mongodb"
import { sync as uid } from "uid-safe"
import config from "../../../config/beluga"
import memcached from "../../../memcached"
import assert, { is_object, is_string } from "../../../assert"

export default async (db, params) => {
    if (is_string(params.token) === false) {
        throw new Error("@tokenを指定してください")
    }
    if (is_string(params.secret) === false) {
        throw new Error("@secretを指定してください")
    }

    const document = await memcached.v1.access_token.show(db, params)
    if (document === null) {
        return null
    }

    const { secret, user_id } = document
    assert(is_string(secret), "$secret must be of type string")
    assert(user_id instanceof ObjectID, "$user_id must be an instance of ObjectID")
    assert(params.secret === secret, "不正な@secretです")

    return user_id.toHexString()
}