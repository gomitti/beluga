import memcached from "../../../../memcached"
import assert from "../../../../assert"

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const user_ids = await memcached.v1.mute.users.list(db, params)
    const users = []
    for (let j = 0; j < user_ids.length; j++) {
        const user_id = user_ids[j]
        const user = await memcached.v1.user.show(db, { "id": user_id })
        if (user) {
            users.push(user)
        }
    }

    return users
}