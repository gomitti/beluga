import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const id = try_convert_to_object_id(params.id, "@idが不正です")

    const collection = db.collection("statuses")
    const status = await collection.findOne({ "_id": id })
    if (status === null) {
        return null
    }
    status.id = status._id
    for (const key in status) {
        if (key.indexOf("_") == 0) {
            delete status[key]
        }
    }
    return status
}