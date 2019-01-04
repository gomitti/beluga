import api from "../../../../../api"
import memcached from "../../../../../memcached"
import assert from "../../../../../assert";

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    assert(Array.isArray(params.media_ids), "画像を指定してください")

    const media_ids = []
    for (let j = 0; j < params.media_ids.length; j++) {
        const id = params.media_ids[j]
        const media = await memcached.v1.media.show(db, { id })
        if (media) {
            media_ids.push(media.id)
        }
    }
    await api.v1.account.pin.media.update(db, { "user_id": user.id, media_ids })

    memcached.v1.account.pin.media.list.flush(user.id)

    return true
}