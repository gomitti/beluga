import api from "../../../../../api"
import memcached from "../../../../../memcached"
import assert from "../../../../../assert";

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    assert(Array.isArray(params.shortnames), "絵文字を指定してください")

    await api.v1.account.pin.emoji.update(db, { "user_id": user.id, "shortnames": params.shortnames })
    
    memcached.v1.delete_account_pin_emoji_from_cache(user.id)

    return true
}