import { ObjectID } from "mongodb"
import config from "../../../../../config/beluga"
import memcached from "../../../../../memcached"
import assert from "../../../../../assert"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    
    const media = await memcached.v1.account.pin.media.list(db, params)
    assert("@media must be of type array")
    
    return media
}