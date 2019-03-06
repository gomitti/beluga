import assert, { is_number } from "../../../../assert"
import config from "../../../../config/beluga"
import memcached from "../../../../memcached"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const user_to_update = await memcached.v1.user.show(db, { "id": params.user_id_to_update })
    assert(user_to_update !== null, "ユーザーが見つかりません")

    const requested_by = await memcached.v1.user.show(db, { "id": params.requested_by })
    assert(requested_by !== null, "ユーザーが見つかりません")
    
    const community = await memcached.v1.community.show(db, { "id": params.community_id })
    assert(community !== null, "コミュニティが見つかりません")

    return true
}