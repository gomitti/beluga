import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const { token, secret, deleted_token } = await api.v1.access_token.generate(db, params)
    if (deleted_token) {
        memcached.v1.access_token.show.flush(deleted_token)
    }
    memcached.v1.access_token.list.flush(user.id)
    
    return { token, secret }
}