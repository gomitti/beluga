import memcached from "../../../memcached"
import config from "../../../config/beluga"

export default async (db, params) => {
    params = Object.assign({
        "threshold": config.server.channels.min_statuses_count_to_display
    }, params)
    return await memcached.v1.server.channels(db, { "id": params.id, "threshold": params.threshold })
}