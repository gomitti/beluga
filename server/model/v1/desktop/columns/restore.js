import api from "../../../../api"
import memcached from "../../../../memcached"
import assert, { is_string, is_array, is_object } from "../../../../assert"
import assign from "../../../../lib/assign"

export default async (db, params) => {
    const { pathname } = params
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    return await api.v1.desktop.columns.restore(db, { "user_id": user.id, "pathname": pathname })
}