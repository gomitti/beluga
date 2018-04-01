import memcached from "../../../memcached"

export default async (db, params) => {
    return await memcached.v1.hashtag.show(db, params)
}