import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"
import assert from "../../../assert"
import constants from "../../../constants"


export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const status = await memcached.v1.status.show(db, { "id": params.status_id })
    assert(status !== null, "投稿が見つかりません")

    if (status.user_id.equals(user.id) === false) {
        const { community_id, channel_id } = status
        if (community_id && channel_id) {
            const community = await memcached.v1.community.show(db, { "id": community_id })
            const channel = await memcached.v1.channel.show(db, { "id": channel_id })
            assert(community !== null, "コミュニティが見つかりません")
            assert(channel !== null, "チャンネルが見つかりません")
            const permissions = await memcached.v1.channel.permissions.get(db, { "channel_id": channel.id })
            const role = await memcached.v1.user.role.get(db, { "community_id": community.id, "user_id": user.id })
            const permissions_for_role = permissions[role]
            const reaction_allowed = permissions_for_role[constants.channel.permission.add_reaction_to_status]
            if (reaction_allowed !== true) {
                throw new Error("リアクションは禁止されています")
            }
        }
    }

    if (config.status.reaction.allow_self_reactions === false) {
        assert(status.user_id.equals(user.id) === false, "自分の投稿にリアクションを追加することはできません")
    }

    const reaction = await api.v1.reaction.add(db, params)

    // キャッシュの消去
    memcached.v1.status.show.flush(status.id)
    memcached.v1.reaction.show.flush(status.id)

    return reaction
}