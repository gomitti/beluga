import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert";

export default async (db, params) => {
    const channel = await memcached.v1.channel.show(db, { "id": params.channel_id })
    assert(channel !== null, "チャンネルが見つかりません")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const already_in_channel = await memcached.v1.channel.joined(db, {
        "user_id": user.id,
        "channel_id": channel.id
    })
    assert(already_in_channel === false, "すでに参加しています")

    if (channel.invitation_needed) {
        throw new Error("このチャンネルは承認制のため参加できません")
    }

    const already_in_community = await memcached.v1.community.joined(db, {
        "user_id": user.id,
        "community_id": channel.community_id
    })
    assert(already_in_community === true, "コミュニティに参加していないため、このコミュニティ上のチャンネルには参加できません")

    await api.v1.channel.join(db, {
        "user_id": user.id,
        "community_id": channel.community_id,
        "channel_id": channel.id,
    })

    const members_count = await db.collection("channel_members").find({
        "community_id": channel.community_id
    }).count()
    await db.collection("channels").updateOne({ "_id": channel.id }, {
        "$set": { members_count }
    })

    // キャッシュの消去
    memcached.v1.channel.joined.flush(channel.id, user.id)
    memcached.v1.channels.joined.flush(channel.community_id, user.id)
    memcached.v1.channel.members.flush(channel.id)

    return true
}