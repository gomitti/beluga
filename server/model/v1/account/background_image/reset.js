import api from "../../../../api"
import memcached from "../../../../memcached"
import assert from "../../../../assert";

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    
    await api.v1.account.background_image.reset(db, params)

    // キャッシュの消去
    memcached.v1.delete_user_from_cache(user)

    return true
}