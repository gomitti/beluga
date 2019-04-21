import config from "../../../../config/beluga"

export default async (db, params) => {
    const query = {}
    params = Object.assign({
        "count": 5000
    }, params)
    const rows = await db.collection("statuses").find({
        "likes_count": {
            $gte: 10
        }
    }).sort({ "likes_count": -1 }).limit(params.count).toArray()
    const status_ids = []
    rows.forEach(row => {
        status_ids.push(row._id.toHexString())
    })
    return status_ids
}