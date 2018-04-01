import api from "../../../../api"
import memcached from "../../../../memcached"
import assert from "../../../../assert";

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    
    const url = await api.v1.account.avatar.update(db, params)

    // キャッシュの消去
    memcached.v1.delete_user_from_cache(user)

    return url
}