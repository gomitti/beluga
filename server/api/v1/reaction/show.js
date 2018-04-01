import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const status_id = try_convert_to_object_id(params.status_id, "@status_idが不正です")

    const collection = db.collection("reactions")
    const rows = await collection.find({ status_id }).toArray()
    if (rows === null) {
        return []
    }
    const result = {}
    for (const row of rows) {
        const { shortname } = row
        if (!(shortname in result)) {
            result[shortname] = 1
            continue
        }
        result[shortname] += 1
    }
    return result
}