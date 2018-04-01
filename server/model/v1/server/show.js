import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import memcached from "../../../memcached"

export default async (db, params) => {
    return await memcached.v1.server.show(db, { "id": params.id, "name": params.name })
}