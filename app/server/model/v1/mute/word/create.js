import memcached from "../../../../memcached"
import api from "../../../../api"
import assert from "../../../../assert"

export default async (db, params) => {
    const target_user = await memcached.v1.user.show(db, { "id": params.target_user_id })
    assert(target_user !== null, "対象のユーザーが見つかりません")

    const requested_by = await memcached.v1.user.show(db, { "id": params.requested_by })
    assert(requested_by !== null, "対象のユーザーが見つかりません")

    await api.v1.mute.user.create(db, params)
    memcached.v1.mute.users.list.flush(requested_by.id)

    return true
}