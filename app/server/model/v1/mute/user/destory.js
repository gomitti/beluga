import memcached from "../../../../memcached"
import api from "../../../../api"
import assert from "../../../../assert"

export default async (db, params) => {
    const user_to_unmute = await memcached.v1.user.show(db, { "id": params.user_id_to_unmute })
    assert(user_to_unmute !== null, "対象のユーザーが見つかりません")

    const requested_by = await memcached.v1.user.show(db, { "id": params.requested_by })
    assert(requested_by !== null, "対象のユーザーが見つかりません")

    await api.v1.mute.user.destory(db, params)
    memcached.v1.mute.users.list.flush(requested_by.id)

    return true
}