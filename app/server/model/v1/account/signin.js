import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "name": params.name })
    assert(user !== null, "ユーザーが見つかりません")

    await api.v1.account.signin(db, {
        "raw_password": params.raw_password,
        "user_id": user.id
    })

    // キャッシュの消去
    memcached.v1.user.show.flush(user.id, user.name)

    return await memcached.v1.user.show(db, { "id": user.id })
}