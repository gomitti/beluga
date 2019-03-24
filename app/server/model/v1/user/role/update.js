import assert, { is_number } from "../../../../assert"
import constants from "../../../../constants"
import memcached from "../../../../memcached"
import api from "../../../../api"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const user_to_update = await memcached.v1.user.show(db, { "id": params.user_id_to_update })
    assert(user_to_update !== null, "ユーザーが見つかりません")

    const requested_by = await memcached.v1.user.show(db, { "id": params.requested_by })
    assert(requested_by !== null, "ユーザーが見つかりません")

    const community = await memcached.v1.community.show(db, { "id": params.community_id })
    assert(community !== null, "コミュニティが見つかりません")

    const new_role_number = params.role
    assert(is_number(new_role_number))

    const role_of_requested_user = await memcached.v1.user.role.get(db, {
        "community_id": community.id,
        "user_id": requested_by.id
    })
    const role_of_user_to_update = await memcached.v1.user.role.get(db, {
        "community_id": community.id,
        "user_id": user_to_update.id
    })
    if (new_role_number === constants.role.admin) {
        throw new Error("管理者に変更することはできません")
    }
    if (community.created_by.equals(user_to_update.id)) {
        throw new Error("コミュニティ作成者の役職を変更することはできません")
    }
    if (requested_by.id.equals(user_to_update.id)) {
        throw new Error("自分自身の役職を変更することはできません")
    }
    if (role_of_requested_user <= role_of_user_to_update) {
        throw new Error("権限がありません")
    }
    if (role_of_requested_user !== constants.role.admin && role_of_requested_user !== constants.role.moderator) {
        throw new Error("権限がありません")
    }
    if (role_of_requested_user <= new_role_number) {
        throw new Error("自分より上位の役職に変更することはできません")
    }

    await api.v1.user.role.update(db, {
        "user_id": user_to_update.id,
        "community_id": community.id,
        "role": new_role_number,
    })
    memcached.v1.user.role.get.flush(community.id, user_to_update.id)

    return true
}