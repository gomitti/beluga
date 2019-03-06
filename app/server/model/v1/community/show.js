import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import memcached from "../../../memcached"
import assert, { is_bool } from "../../../assert";

export default async (db, params) => {
    const community = await memcached.v1.community.show(db, { "id": params.id, "name": params.name })
    if (community === null) {
        return null
    }
    const { requested_by } = params
    if (requested_by) {
        community.joined = await memcached.v1.community.joined(db, { "community_id": community.id, "user_id": requested_by })
        assert(is_bool(community.joined), "$community.joined must be of type boolean")
    }
    return community
}