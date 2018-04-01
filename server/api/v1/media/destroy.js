import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const id = try_convert_to_object_id(params.id, "@idが不正です")
    await db.collection("media").deleteOne({ "_id": id })
    return true
}