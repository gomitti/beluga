import memcached from "../../../memcached"
import model from "../../../model"
import assert from "../../../assert"

const compare = (a, b) => {
    if (a.name > b.name) {
        return 1
    }
    if (a.name < b.name) {
        return -1
    }
    return 0
}

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const server = await memcached.v1.server.show(db, { "id": params.server_id })
    assert(server !== null, "サーバーが見つかりません")

    const channel_ids = await memcached.v1.channels.joined(db, params)
    if (channel_ids.length == 0) {
        return []
    }

    const channels = []
    for (let j = 0; j < channel_ids.length; j++) {
        const channel_id = channel_ids[j]
        const channel = await model.v1.channel.show(db, { "id": channel_id })
        if (channel === null) {
            continue
        }
        channels.push(channel)
    }
    channels.sort(compare)

    return channels
}