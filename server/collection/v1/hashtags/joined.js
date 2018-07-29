import memcached from "../../../memcached"
import model from "../../../model"
import assert from "../../../assert";

const compare = (a, b) => {
    if (a.tagname > b.tagname) {
        return 1
    }
    if (a.tagname < b.tagname) {
        return -1
    }
    return 0
}

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const server = await memcached.v1.server.show(db, { "id": params.server_id })
    assert(server !== null, "サーバーが見つかりません")

    const hashtag_ids = await memcached.v1.hashtags.joined(db, params)
    if (hashtag_ids.length == 0) {
        return []
    }

    const hashtags = []
    for (const hashtag_id of hashtag_ids) {
        const hashtag = await model.v1.hashtag.show(db, { "id": hashtag_id })
        if (hashtag === null) {
            continue
        }
        hashtags.push(hashtag)
    }
    hashtags.sort(compare)

    return hashtags
}