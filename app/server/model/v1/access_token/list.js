import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import memcached from "../../../memcached"
import assert from "../../../assert"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const list = await memcached.v1.access_token.list(db, params)
    assert("@list must be of type array")

    return list
}