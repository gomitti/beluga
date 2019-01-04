import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import memcached from "../../../memcached"
import assert, { is_bool } from "../../../assert";

export default async (db, params) => {
    const server = await memcached.v1.server.show(db, { "id": params.id, "name": params.name })
    if (server === null) {
        return null
    }
    const { requested_by } = params
    if (requested_by) {
        server.joined = await memcached.v1.server.joined(db, { "server_id": server.id, "user_id": requested_by })
        assert(is_bool(server.joined), "$server.joined must be of type boolean")
    }
    return server
}