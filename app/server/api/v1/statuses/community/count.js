import config from "../../../../config/beluga"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const query = {}
    if (params.since_id) {
        const since_id = try_convert_to_object_id(params.since_id, "$since_idが不正です")
        query.status_id = { "$gt": since_id }
    }
    if (params.max_id) {
        const max_id = try_convert_to_object_id(params.max_id, "$max_idが不正です")
        query.status_id = { "$lt": max_id }
    }
    query.belongs_to = try_convert_to_object_id(params.community_id, "$community_idが不正です")
    return await db.collection("community_timeline").find(query).count()
}