import memcached from "../../../memcached"
import assert, { is_bool } from "../../../assert";

export default async (db, params) => {
    const hashtag = await memcached.v1.hashtag.show(db, params)
    if (hashtag === null) {
        return null
    }
    const { requested_by } = params
    if (requested_by) {
        hashtag.joined = await memcached.v1.hashtag.joined(db, { "hashtag_id": hashtag.id, "user_id": requested_by })
        assert(is_bool(hashtag.joined), "@hashtag.joined must be of type boolean")
    }
    return hashtag
}