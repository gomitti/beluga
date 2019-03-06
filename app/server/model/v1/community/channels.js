import memcached from "../../../memcached"
import config from "../../../config/beluga"

export default async (db, params) => {
    params = Object.assign({
        "threshold": config.community.channel.min_statuses_count_to_display
    }, params)
    return await memcached.v1.community.channels(db, { "id": params.id, "threshold": params.threshold })
}