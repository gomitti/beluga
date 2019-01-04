import memcached from "../../../memcached"
import assert, { is_bool } from "../../../assert";

export default async (db, params) => {
    const channel = await memcached.v1.channel.show(db, params)
    if (channel === null) {
        return null
    }
    const { requested_by } = params
    if (requested_by) {
        channel.joined = await memcached.v1.channel.joined(db, { "channel_id": channel.id, "user_id": requested_by })
        assert(is_bool(channel.joined), "$channel.joined must be of type boolean")
    }
    return channel
}