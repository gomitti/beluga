import memcached from "../../../memcached"

export default async (db, params) => {
    return await memcached.v1.media.aggregate(db, { "user_id": params.user_id })
}