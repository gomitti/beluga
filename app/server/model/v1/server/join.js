import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const server = await memcached.v1.server.show(db, { "id": params.server_id })
    assert(server !== null, "サーバーが見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const joined = await memcached.v1.server.joined(db, {
        "user_id": user.id,
        "server_id": server.id
    })
    assert(joined === false, "すでに参加しています")

    await api.v1.server.join(db, {
        "user_id": user.id,
        "server_id": server.id
    })

    const members_count = await db.collection("server_members").find({
        "server_id": server.id
    }).count()

    await db.collection("servers").updateOne({ "_id": server.id }, {
        "$set": { members_count }
    })

    // キャッシュの消去
    memcached.v1.server.joined.flush(server.id, user.id)
    memcached.v1.server.members.flush(server.id)
    memcached.v1.server.show.flush(server.id, server.name)

    return true
}