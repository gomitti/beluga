import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const id = try_convert_to_object_id(params.id, "@idが不正です")
    const created_by = try_convert_to_object_id(params.created_by, "@created_byが不正です")

    return await db.collection("servers").deleteOne({ "_id": id, created_by })
}